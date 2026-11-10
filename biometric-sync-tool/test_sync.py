"""Offline bridge regression checks; never connect to a real terminal or server."""
from contextlib import closing
import datetime
import importlib.util
import io
import json
import pathlib
import sqlite3
import tempfile
import types
import unittest
import urllib.error
from unittest.mock import Mock, patch

SPEC = importlib.util.spec_from_file_location("bridge", pathlib.Path(__file__).with_name("sync.py"))
bridge = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(bridge)


class BridgeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = str(pathlib.Path(self.temp.name) / "attendance.db")
        bridge.init_offline_db(self.path)
        self.cfg = bridge.merge(bridge.DEFAULT_CONFIG, {
            "supabase": {"url": "https://invalid.example", "anon_key": "test", "device_key": "test-key"}
        })

    def test_local_device_reads_pin_and_name_without_biometric_templates(self):
        conn = Mock()
        conn.records = 1
        conn.get_attendance.return_value = [types.SimpleNamespace(
            user_id="001", timestamp=datetime.datetime.now().replace(microsecond=0), punch=0, status=1
        )]
        conn.get_users.return_value = [types.SimpleNamespace(user_id="001", name="Device Employee")]
        factory = Mock(return_value=Mock(connect=Mock(return_value=conn)))
        with patch.dict("sys.modules", {"zk": types.SimpleNamespace(ZK=factory)}):
            self.assertTrue(bridge.fetch_local_device(self.cfg, self.path, {}))
        with closing(sqlite3.connect(self.path)) as db, db:
            row = db.execute("SELECT pin, staff_name, synced_to_supabase FROM attendance_cache").fetchone()
        self.assertEqual(row, ("001", "Device Employee", bridge.PENDING))
        conn.get_templates.assert_not_called()
        conn.disconnect.assert_called_once()

    def test_name_read_failure_does_not_lose_attendance(self):
        conn = Mock()
        conn.records = 1
        conn.get_attendance.return_value = [types.SimpleNamespace(
            user_id="1", timestamp=datetime.datetime.now(), punch=0, status=1
        )]
        conn.get_users.side_effect = RuntimeError("user read failed")
        with patch.dict("sys.modules", {"zk": types.SimpleNamespace(ZK=Mock(return_value=Mock(connect=Mock(return_value=conn))))}):
            self.assertTrue(bridge.fetch_local_device(self.cfg, self.path, {}))
        with closing(sqlite3.connect(self.path)) as db, db:
            self.assertEqual(db.execute("SELECT count(*) FROM attendance_cache").fetchone()[0], 1)

    def test_offline_retry_preserves_name_pin_and_time_and_prevents_duplicates(self):
        now = datetime.datetime.now().replace(microsecond=0)
        with closing(sqlite3.connect(self.path)) as db, db:
            punches = [("001", now, "check_in", "fingerprint")]
            self.assertEqual(bridge.store_punches(db, punches, "serial", {"001": "Employee"}), 1)
            self.assertEqual(bridge.store_punches(db, punches, "serial", {"001": "Employee"}), 0)
        with patch.object(bridge, "rpc_ingest", side_effect=bridge.UploadStop("offline")):
            bridge.push_unsynced(self.cfg, self.path)
        with closing(sqlite3.connect(self.path)) as db, db:
            self.assertEqual(db.execute("SELECT synced_to_supabase FROM attendance_cache").fetchone()[0], bridge.PENDING)
        with patch.object(bridge, "rpc_ingest", return_value={"received": 1, "inserted": 1}) as rpc:
            bridge.push_unsynced(self.cfg, self.path)
        payload = rpc.call_args.args[1][0]
        self.assertEqual(payload["pin"], "001")
        self.assertEqual(payload["staff_name"], "Employee")
        self.assertEqual(payload["scan_time"], now.strftime("%Y-%m-%dT%H:%M:%S+00:00"))
        self.assertNotIn("staff_id", payload)
        with closing(sqlite3.connect(self.path)) as db, db:
            self.assertEqual(db.execute("SELECT synced_to_supabase FROM attendance_cache").fetchone()[0], bridge.SYNCED)

    def test_cloud_and_local_break_codes_are_separate(self):
        self.assertEqual(bridge.CLOUD_PUNCH_TYPES[2], "break_in")
        self.assertEqual(bridge.CLOUD_PUNCH_TYPES[3], "break_out")
        self.assertEqual(bridge.PUNCH_TYPES[2], "break_out")

    def test_missing_device_key_is_caught_before_background_start(self):
        self.cfg["supabase"]["device_key"] = "CHANGE_ME"
        self.assertTrue(any("device_key" in message for message in bridge.validate_config(self.cfg)))

    def test_valid_configuration_has_no_setup_errors(self):
        self.assertEqual(bridge.validate_config(self.cfg), [])

    def test_invalid_reload_values_are_detected(self):
        self.cfg["sync"]["interval_seconds"] = "invalid"
        self.cfg["device"]["port"] = 70000
        self.assertEqual(len(bridge.validate_config(self.cfg)), 2)

    def test_missing_pin_is_not_converted_into_a_user_named_none(self):
        with closing(sqlite3.connect(self.path)) as db, db:
            count = bridge.store_punches(db, [(None, datetime.datetime.now(), "check_in", "fingerprint")], "serial")
        self.assertEqual(count, 0)

    def test_legacy_cache_is_upgraded_without_losing_pending_records(self):
        legacy = str(pathlib.Path(self.temp.name) / "legacy.db")
        with closing(sqlite3.connect(legacy)) as db, db:
            db.execute("CREATE TABLE attendance_cache (id INTEGER PRIMARY KEY, pin TEXT, scan_time TEXT, punch_type TEXT, verify_type TEXT, device_sn TEXT, synced_to_supabase INTEGER, created_at TEXT, UNIQUE(pin, scan_time))")
            db.execute("INSERT INTO attendance_cache VALUES (1, '001', '2026-11-01 08:00:00', 'check_in', 'fingerprint', 'serial', 0, '2026-11-01')")
        bridge.init_offline_db(legacy)
        with closing(sqlite3.connect(legacy)) as db, db:
            self.assertEqual(db.execute("SELECT pin, synced_to_supabase, staff_name FROM attendance_cache").fetchone(), ("001", 0, None))

    def test_rpc_response_must_confirm_the_whole_batch(self):
        for body in (b"not-json", b"{}", b'{"received":0,"inserted":0}', b'[]'):
            with self.subTest(body=body), patch.object(bridge.urllib.request, "urlopen", return_value=io.BytesIO(body)):
                with self.assertRaises(bridge.UploadStop):
                    bridge.rpc_ingest(self.cfg, [{"pin": "001"}])

    def test_server_configuration_errors_preserve_pending_rows(self):
        with closing(sqlite3.connect(self.path)) as db, db:
            bridge.store_punches(db, [("001", datetime.datetime.now(), "check_in", "fingerprint")], "serial")
        for status, code in ((401, "42501"), (404, "PGRST202"), (400, "42703"), (429, ""), (503, "")):
            error = urllib.error.HTTPError("https://invalid.example", status, "test", {}, io.BytesIO(json.dumps({"code": code}).encode()))
            with self.subTest(status=status, code=code), patch.object(bridge.urllib.request, "urlopen", side_effect=error):
                bridge.push_unsynced(self.cfg, self.path)
            with closing(sqlite3.connect(self.path)) as db, db:
                self.assertEqual(db.execute("SELECT synced_to_supabase FROM attendance_cache").fetchone()[0], bridge.PENDING)

    def test_server_acknowledgement_accepts_already_uploaded_duplicates(self):
        with patch.object(bridge.urllib.request, "urlopen", return_value=io.BytesIO(b'{"received":1,"inserted":0}')):
            result = bridge.rpc_ingest(self.cfg, [{"pin": "001"}])
        self.assertEqual(result["received"], 1)

    def test_single_instance_lock_blocks_a_second_process(self):
        import subprocess
        import sys
        lock_path = str(pathlib.Path(self.temp.name) / "sync.lock")
        pid_path = str(pathlib.Path(self.temp.name) / "sync.pid")
        with patch.object(bridge, "LOCK_PATH", lock_path), patch.object(bridge, "PID_PATH", pid_path):
            handle = bridge.acquire_single_instance_lock()
            self.assertIsNotNone(handle)
            try:
                source = ("import sys; sys.path.insert(0, sys.argv[1]); import sync; "
                          "sync.LOCK_PATH=sys.argv[2]; sync.PID_PATH=sys.argv[3]; "
                          "sys.exit(0 if sync.acquire_single_instance_lock() is None else 1)")
                result = subprocess.run([sys.executable, "-B", "-c", source, str(pathlib.Path(bridge.__file__).parent), lock_path, pid_path], capture_output=True)
                self.assertEqual(result.returncode, 0, result.stderr.decode())
            finally:
                handle.close()

    def test_setup_check_from_a_folder_with_spaces_and_arabic_characters(self):
        import shutil
        import subprocess
        import sys
        root = pathlib.Path(bridge.__file__).parent
        target = pathlib.Path(self.temp.name) / "Reception Tool اختبار"
        target.mkdir()
        for name in ("sync.py", "check-setup.py"):
            shutil.copy2(root / name, target / name)
        shutil.copytree(root / "zk", target / "zk", ignore=shutil.ignore_patterns("__pycache__"))
        (target / "config.json").write_text(json.dumps(self.cfg), encoding="utf-8")
        result = subprocess.run([sys.executable, "-B", "-W", "error", str(target / "check-setup.py")], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(result.stderr, "")
        self.assertIn("[OK]", result.stdout)

    def test_setup_check_rejects_unconfigured_key_without_a_traceback(self):
        import subprocess
        import sys
        import shutil
        root = pathlib.Path(bridge.__file__).parent
        target = pathlib.Path(self.temp.name) / "incomplete"
        target.mkdir()
        for name in ("sync.py", "check-setup.py"):
            shutil.copy2(root / name, target / name)
        shutil.copytree(root / "zk", target / "zk", ignore=shutil.ignore_patterns("__pycache__"))
        self.cfg["supabase"]["device_key"] = "CHANGE_ME"
        (target / "config.json").write_text(json.dumps(self.cfg), encoding="utf-8")
        result = subprocess.run([sys.executable, "-B", "-W", "error", str(target / "check-setup.py")], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertEqual(result.stderr, "")
        self.assertIn("supabase.device_key", result.stdout)


if __name__ == "__main__":
    unittest.main()
