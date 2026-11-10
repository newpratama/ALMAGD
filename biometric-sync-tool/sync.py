#!/usr/bin/env python3
"""
ALMAGD Biometric Sync Bridge
============================
Copies attendance punches from the Fingerspot Revo W-230N (ZKTeco-compatible socket
protocol, port 4370) -- or, optionally, from the Fingerspot Cloud API -- into the
ALMAGD Supabase project.

Design notes
------------
* Single instance: an OS file lock prevents two copies from running (the device accepts
  one connection at a time).
* Zero data loss: every punch lands in a local SQLite cache first and is pushed later;
  an internet outage only delays the upload.
* Gentle on the device: it never reads the whole log unless the device's record counter
  changed (plus a periodic safety full read), and it does NOT lock the terminal by
  default (set device.lock_during_read=true to restore the old behaviour; the terminal
  is always re-enabled in a ``finally`` block).
* Efficient upload: punches go up in batches through the ``ingest_attendance`` RPC,
  authenticated with a per-device key (no anonymous table access). A batch rejected for
  data reasons is split so one bad record can never block the queue; hopeless records
  are quarantined (status 2) and logged.
* Time convention: scan_time is the device wall-clock time sent with a ``+00:00`` suffix
  ("floating time") so it matches what the admin UI displays. Do not convert time zones.
"""

import os
import sys
import json
import time
import sqlite3
import logging
import datetime
import urllib.request
import urllib.error
from urllib.parse import urlparse
from copy import deepcopy
from logging.handlers import RotatingFileHandler

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(SCRIPT_DIR)
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

CONFIG_PATH = os.path.join(SCRIPT_DIR, "config.json")
LOCK_PATH = os.path.join(SCRIPT_DIR, "sync.lock")
PID_PATH = os.path.join(SCRIPT_DIR, "sync.pid")
LOG_PATH = os.path.join(SCRIPT_DIR, "sync.log")

PENDING, SYNCED, REJECTED = 0, 1, 2
BATCH_SIZE = 200
MAX_BATCHES_PER_CYCLE = 25
KEY_PLACEHOLDERS = ("", "CHANGE_ME", "PUT_DEVICE_KEY_HERE")

DEFAULT_CONFIG = {
    "mode": "local",  # local | cloud | auto (local first, cloud as fallback)
    "device": {
        "ip": "192.168.1.201",
        "port": 4370,
        "serial_number": "",
        "timeout": 5,
        "force_udp": True,
        "password": 0,
        "lock_during_read": False,
        "full_read_every_seconds": 600,
    },
    "supabase": {"url": "", "anon_key": "", "device_key": "CHANGE_ME"},
    "cloud_api": {"enabled": False, "token": "", "cloud_id": ""},
    "sync": {"interval_seconds": 60, "offline_db": "attendance_cache.db", "keep_days": 90},
}

PUNCH_TYPES = {0: "check_in", 1: "check_out", 2: "break_out", 3: "break_in",
               4: "overtime_in", 5: "overtime_out"}
# Fingerspot cloud status codes differ from ZKTeco socket break codes.
CLOUD_PUNCH_TYPES = {0: "check_in", 1: "check_out", 2: "break_in", 3: "break_out",
                     4: "overtime_in", 5: "overtime_out"}
VERIFY_TYPES = {0: "password", 1: "fingerprint", 2: "card", 3: "card"}

logger = logging.getLogger("almagd-sync")


# --------------------------------------------------------------------------- setup
def setup_logging():
    logger.setLevel(logging.INFO)
    fmt = logging.Formatter("[%(asctime)s] %(message)s", "%Y-%m-%d %H:%M:%S")
    try:
        fh = RotatingFileHandler(LOG_PATH, maxBytes=1_000_000, backupCount=3, encoding="utf-8")
        fh.setFormatter(fmt)
        logger.addHandler(fh)
    except Exception:
        pass
    if sys.stdout is not None:  # pythonw has no stdout
        sh = logging.StreamHandler(sys.stdout)
        sh.setFormatter(fmt)
        logger.addHandler(sh)


def log(msg):
    logger.info(msg)


def acquire_single_instance_lock():
    """Return an open, locked file handle, or None if another instance is running."""
    handle = open(LOCK_PATH, "a+")
    handle.seek(0, os.SEEK_END)
    if handle.tell() == 0:
        handle.write("\0")
        handle.flush()
    try:
        try:
            import msvcrt  # Windows
            handle.seek(0)
            msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
        except ImportError:
            import fcntl  # POSIX (dev / testing)
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        handle.close()
        return None
    with open(PID_PATH, "w") as f:
        f.write(str(os.getpid()))
    return handle


def merge(base, extra):
    out = deepcopy(base)
    for k, v in (extra or {}).items():
        out[k] = merge(base[k], v) if isinstance(v, dict) and isinstance(base.get(k), dict) else deepcopy(v)
    return out


def load_config():
    cfg = DEFAULT_CONFIG
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, "r", encoding="utf-8-sig") as f:
            cfg = merge(DEFAULT_CONFIG, json.load(f))
    return cfg


def validate_config(cfg):
    """Return actionable setup errors without printing credentials."""
    errors = []
    if cfg.get("mode") not in ("local", "auto", "cloud"):
        errors.append("mode must be local, auto or cloud")
    for section in ("device", "supabase", "cloud_api", "sync"):
        if not isinstance(cfg.get(section), dict):
            errors.append(f"{section} must be a JSON object")
    if errors:
        return errors
    def number(section, key, minimum, maximum):
        value = cfg[section].get(key)
        if isinstance(value, bool) or not isinstance(value, int) or not minimum <= value <= maximum:
            errors.append(f"{section}.{key} must be an integer between {minimum} and {maximum}")
    if cfg.get("mode") in ("local", "auto"):
        if not isinstance(cfg["device"].get("ip"), str) or not cfg["device"]["ip"].strip():
            errors.append("device.ip is required")
        number("device", "port", 1, 65535)
        number("device", "timeout", 1, 120)
        number("device", "password", 0, 4294967295)
        number("device", "full_read_every_seconds", 15, 86400)
        for key in ("force_udp", "lock_during_read"):
            if not isinstance(cfg["device"].get(key), bool):
                errors.append(f"device.{key} must be true or false")
    number("sync", "interval_seconds", 15, 86400)
    number("sync", "keep_days", 1, 3650)
    if not isinstance(cfg["sync"].get("offline_db"), str) or not cfg["sync"]["offline_db"].strip():
        errors.append("sync.offline_db is required")
    target = cfg["supabase"].get("url", "")
    try:
        parsed = urlparse(target)
        valid_url = parsed.scheme == "https" and bool(parsed.hostname) and not parsed.username and not parsed.password
    except (ValueError, TypeError, AttributeError):
        valid_url = False
    if not valid_url:
        errors.append("supabase.url must be a valid HTTPS project URL")
    for key in ("anon_key", "device_key"):
        value = cfg["supabase"].get(key)
        if not isinstance(value, str) or value.strip() in KEY_PLACEHOLDERS:
            errors.append(f"supabase.{key} must be configured before starting")
    cloud = cfg["cloud_api"]
    if cfg.get("mode") in ("cloud", "auto"):
        if not cloud.get("enabled") or not cloud.get("token") or not cloud.get("cloud_id"):
            errors.append("cloud_api requires enabled=true, token and cloud_id")
    return errors


# --------------------------------------------------------------------------- cache db
def db_connect(db_path):
    db = sqlite3.connect(db_path, timeout=30)
    db.execute("PRAGMA journal_mode=WAL")
    return db


def init_offline_db(db_path):
    db = db_connect(db_path)
    db.execute("""
        CREATE TABLE IF NOT EXISTS attendance_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pin TEXT NOT NULL,
            scan_time TEXT NOT NULL,
            punch_type TEXT DEFAULT 'check_in',
            verify_type TEXT DEFAULT 'fingerprint',
            device_sn TEXT,
            synced_to_supabase INTEGER DEFAULT 0,
            created_at TEXT,
            UNIQUE(pin, scan_time)
        )""")
    cols = {r[1] for r in db.execute("PRAGMA table_info(attendance_cache)")}
    if "last_error" not in cols:
        db.execute("ALTER TABLE attendance_cache ADD COLUMN last_error TEXT")
    if "staff_name" not in cols:
        db.execute("ALTER TABLE attendance_cache ADD COLUMN staff_name TEXT")
    db.execute("CREATE INDEX IF NOT EXISTS idx_cache_pending ON attendance_cache(synced_to_supabase)")
    db.execute("CREATE TABLE IF NOT EXISTS sync_meta (key TEXT PRIMARY KEY, value TEXT)")
    db.commit()
    db.close()


def get_meta(db, key, default=None):
    row = db.execute("SELECT value FROM sync_meta WHERE key = ?", (key,)).fetchone()
    return row[0] if row else default


def set_meta(db, key, value):
    db.execute("INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)", (key, str(value)))


def purge_old(db_path, keep_days):
    cutoff = (datetime.datetime.now() - datetime.timedelta(days=keep_days)).strftime("%Y-%m-%d %H:%M:%S")
    db = db_connect(db_path)
    n = db.execute(
        "DELETE FROM attendance_cache WHERE synced_to_supabase = ? AND scan_time < ?", (SYNCED, cutoff)
    ).rowcount
    db.commit()
    db.close()
    if n:
        log(f"Housekeeping: purged {n} synced punch(es) older than {keep_days} days from local cache")


def plausible(ts):
    """Reject device clock garbage (factory reset dates etc.)."""
    now = datetime.datetime.now()
    return datetime.datetime(2020, 1, 1) <= ts <= now + datetime.timedelta(days=1)


def store_punches(db, punches, device_sn, user_names=None):
    """punches: iterable of (pin, datetime, punch_type, verify_type). Returns #new rows."""
    now_iso = datetime.datetime.now().isoformat()
    user_names = user_names or {}
    new = skipped = 0
    for pin, ts, punch_type, verify_type in punches:
        pin = str(pin).strip() if pin is not None else ""
        if not pin or len(pin) > 32 or not plausible(ts):
            skipped += 1
            continue
        cur = db.execute(
            "INSERT OR IGNORE INTO attendance_cache "
            "(pin, scan_time, punch_type, verify_type, device_sn, synced_to_supabase, created_at, staff_name) "
            "VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
            (pin, ts.strftime("%Y-%m-%d %H:%M:%S"), punch_type, verify_type, device_sn, now_iso, user_names.get(pin)),
        )
        new += cur.rowcount
    if skipped:
        log(f"Ignored {skipped} punch(es) with invalid PIN or implausible timestamp")
    return new


# --------------------------------------------------------------------------- sources
def fetch_local_device(cfg, db_path, state):
    """Read new punches from the terminal. Returns True when the device was reachable."""
    from zk import ZK  # bundled library

    dev = cfg["device"]
    zk = ZK(dev["ip"], port=int(dev["port"]), timeout=int(dev["timeout"]),
            force_udp=bool(dev["force_udp"]), password=int(dev.get("password", 0)))
    conn = None
    locked = False
    try:
        conn = zk.connect()
        conn.read_sizes()  # cheap: refreshes conn.records
        count = int(conn.records)

        db = db_connect(db_path)
        try:
            last_count = get_meta(db, "device_record_count")
            full_due = (time.time() - state.get("last_full_read", 0)) >= int(dev["full_read_every_seconds"])
            if last_count is not None and int(last_count) == count and not full_due:
                return True  # nothing new on the terminal, do not touch its log

            if dev.get("lock_during_read"):
                conn.disable_device()
                locked = True
            attendances = conn.get_attendance()
            if not state.get("users_read_at") or time.time() - state["users_read_at"] >= 600:
                try:
                    state["user_names"] = {
                        str(u.user_id).strip(): str(u.name).strip()[:120]
                        for u in conn.get_users() if str(u.name or "").strip()
                    }
                    state["users_read_at"] = time.time()
                except Exception as e:
                    log(f"User names could not be read; attendance collection continues: {e}")
        finally:
            db.close()
        if locked:
            conn.enable_device()
            locked = False

        punches = [
            (a.user_id, a.timestamp,
             PUNCH_TYPES.get(a.punch, "check_in"), VERIFY_TYPES.get(a.status, "fingerprint"))
            for a in attendances
        ]
        db = db_connect(db_path)
        try:
            new = store_punches(db, punches, dev.get("serial_number") or "", state.get("user_names"))
            set_meta(db, "device_record_count", count)
            db.commit()
        finally:
            db.close()
        state["last_full_read"] = time.time()
        if new:
            log(f"Fetched from device: {new} new punch(es) ({count} records on terminal)")
        return True
    finally:
        if conn:
            try:
                if locked:
                    conn.enable_device()  # never leave the terminal locked
            except Exception:
                pass
            try:
                conn.disconnect()
            except Exception:
                pass


def fetch_cloud(cfg, db_path):
    """Pull today's and yesterday's punches from the Fingerspot Cloud API."""
    c = cfg["cloud_api"]
    if not (c.get("enabled") and c.get("token") and c.get("cloud_id")):
        raise RuntimeError("cloud_api is not enabled/configured in config.json")
    today = datetime.date.today()
    payload = {
        "trans_id": str(int(time.time() * 1000)),
        "cloud_id": c["cloud_id"],
        "start_date": (today - datetime.timedelta(days=1)).isoformat(),
        "end_date": today.isoformat(),
    }
    req = urllib.request.Request(
        "https://developer.fingerspot.io/api/get_attlog",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {c['token']}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    if not body.get("success"):
        raise RuntimeError(f"Fingerspot cloud error: {body.get('message') or body.get('error_code')}")

    punches = []
    for d in body.get("data") or []:
        try:
            ts = datetime.datetime.strptime(d["scan_date"], "%Y-%m-%d %H:%M:%S")
        except (KeyError, ValueError):
            continue
        punches.append((d.get("pin"), ts,
                        CLOUD_PUNCH_TYPES.get(d.get("status_scan"), "check_in"),
                        "password" if d.get("verify") == 2 else "fingerprint"))
    db = db_connect(db_path)
    try:
        new = store_punches(db, punches, c["cloud_id"])
        db.commit()
    finally:
        db.close()
    if new:
        log(f"Fetched from Fingerspot cloud: {new} new punch(es)")


# --------------------------------------------------------------------------- upload
class UploadStop(Exception):
    """Transient/auth problem: stop uploading this cycle but keep rows pending."""


def rpc_ingest(cfg, rows):
    s = cfg["supabase"]
    url = s["url"].rstrip("/") + "/rest/v1/rpc/ingest_attendance"
    body = json.dumps({"p_key": s["device_key"], "p_rows": rows}).encode("utf-8")
    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={"apikey": s["anon_key"], "Authorization": f"Bearer {s['anon_key']}",
                 "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            try:
                result = json.loads(resp.read().decode("utf-8"))
            except (ValueError, UnicodeError):
                raise UploadStop("Server returned an invalid acknowledgement; records remain pending")
            if (not isinstance(result, dict) or type(result.get("received")) is not int
                    or result["received"] != len(rows) or type(result.get("inserted")) is not int
                    or not 0 <= result["inserted"] <= len(rows)):
                raise UploadStop("Server acknowledgement did not confirm this batch; records remain pending")
            return result
    except urllib.error.HTTPError as he:
        try:
            detail = he.read().decode("utf-8", errors="ignore")[:300]
        finally:
            he.close()
        try:
            server_code = str(json.loads(detail).get("code", ""))
        except (ValueError, AttributeError):
            server_code = ""
        if he.code in (401, 403) or '"42501"' in detail:
            raise UploadStop("Upload not authorized (check supabase.device_key); records remain pending")
        if (he.code in (404, 408, 409, 429) or he.code >= 500
                or server_code.startswith(("PGRST", "42", "53", "57"))):
            raise UploadStop(f"Server temporarily unavailable ({he.code})")
        raise ValueError(f"{he.code}: {detail}")  # data problem
    except (urllib.error.URLError, OSError, TimeoutError) as e:
        raise UploadStop(f"Internet or Supabase offline: {e}")


def to_payload(row):
    _id, pin, scan_time, punch_type, verify_type, device_sn, staff_name = row
    return {"pin": pin, "scan_time": scan_time.replace(" ", "T") + "+00:00",
            "punch_type": punch_type, "verify_type": verify_type, "device_sn": device_sn or "", "staff_name": staff_name}


def send_batch(cfg, db, rows):
    """Upload rows; isolate bad records by splitting. Returns number of rows accepted."""
    try:
        rpc_ingest(cfg, [to_payload(r) for r in rows])
    except ValueError as err:
        if len(rows) > 1:
            mid = len(rows) // 2
            return send_batch(cfg, db, rows[:mid]) + send_batch(cfg, db, rows[mid:])
        db.execute("UPDATE attendance_cache SET synced_to_supabase = ?, last_error = ? WHERE id = ?",
                   (REJECTED, str(err), rows[0][0]))
        db.commit()
        log(f"Quarantined unsendable punch pin={rows[0][1]} time={rows[0][2]}: {err}")
        return 0
    db.executemany("UPDATE attendance_cache SET synced_to_supabase = ?, last_error = NULL WHERE id = ?",
                   [(SYNCED, r[0]) for r in rows])
    db.commit()
    return len(rows)


def push_unsynced(cfg, db_path):
    s = cfg["supabase"]
    if not s.get("url") or not s.get("anon_key") or s.get("device_key") in KEY_PLACEHOLDERS:
        log("Upload skipped: set supabase.url, supabase.anon_key and supabase.device_key in config.json")
        return
    db = db_connect(db_path)
    sent = 0
    try:
        for _ in range(MAX_BATCHES_PER_CYCLE):
            rows = db.execute(
                "SELECT id, pin, scan_time, punch_type, verify_type, device_sn, staff_name FROM attendance_cache "
                "WHERE synced_to_supabase = ? ORDER BY scan_time LIMIT ?", (PENDING, BATCH_SIZE)).fetchall()
            if not rows:
                break
            sent += send_batch(cfg, db, rows)
    except UploadStop as e:
        log(str(e))
    finally:
        db.close()
    if sent:
        log(f"Synced {sent} punch(es) to Supabase")


# --------------------------------------------------------------------------- main loop
def sync_cycle(cfg, db_path, state):
    mode = cfg.get("mode", "local")
    reachable = False
    if mode in ("local", "auto"):
        try:
            reachable = fetch_local_device(cfg, db_path, state)
            if state.get("device_down"):
                log("Device connection restored")
            state["device_down"] = 0
        except Exception as e:
            state["device_down"] = state.get("device_down", 0) + 1
            if state["device_down"] == 1 or state["device_down"] % 20 == 0:  # avoid log spam
                dev = cfg["device"]
                log(f"Device unreachable ({dev['ip']}:{dev['port']}), attempt {state['device_down']}: {e}")
    if mode == "cloud" or (mode == "auto" and not reachable):
        try:
            fetch_cloud(cfg, db_path)
        except Exception as e:
            log(f"Cloud fetch failed: {e}")
    push_unsynced(cfg, db_path)


def run_sync_loop():
    try:
        cfg = load_config()
        errors = validate_config(cfg)
        if errors:
            for error in errors:
                log(f"Setup required: {error}")
            return 1
        db_path = os.path.join(SCRIPT_DIR, cfg["sync"]["offline_db"])
        init_offline_db(db_path)
    except Exception as e:
        log(f"Startup failed: {e}")
        return 1
    log("ALMAGD Biometric Sync Bridge started")
    state = {}
    last_purge = 0.0

    while True:
        try:
            candidate = load_config()
            errors = validate_config(candidate)
            if errors:
                raise ValueError("; ".join(errors))
            if candidate["sync"]["offline_db"] != cfg["sync"]["offline_db"]:
                raise ValueError("Restart sync before changing sync.offline_db")
            cfg = candidate
            sync_cycle(cfg, db_path, state)
            if time.time() - last_purge > 86400:
                purge_old(db_path, int(cfg["sync"].get("keep_days", 90)))
                last_purge = time.time()
        except Exception as e:
            log(f"Unexpected loop error: {e}")
        time.sleep(max(15, int(cfg["sync"].get("interval_seconds", 60))))


def main():
    setup_logging()
    try:
        lock = acquire_single_instance_lock()
    except OSError as error:
        log(f"Cannot create the instance lock: {error}")
        return 1
    if lock is None:
        log("Another sync instance is already running. Exiting.")
        return 0
    try:
        return run_sync_loop()
    except KeyboardInterrupt:
        log("Sync stopped")
        return 0
    finally:
        try:
            os.remove(PID_PATH)
        except OSError:
            pass
        lock.close()


if __name__ == "__main__":
    sys.exit(main())
