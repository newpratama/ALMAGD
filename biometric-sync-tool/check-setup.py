"""Offline installation preflight. Does not contact a terminal or upload records."""
import os
from pathlib import Path
import sys
import tempfile


def main():
    root = Path(__file__).resolve().parent
    try:
        import sqlite3
        import ssl
        from sync import load_config, validate_config
        from zk import ZK
        cfg = load_config()
        errors = validate_config(cfg)
        if errors:
            for error in errors:
                print(f"[SETUP REQUIRED] {error}")
            return 1
        # Verify write access before registering an unattended process.
        with tempfile.TemporaryFile(dir=root):
            pass
        cache = Path(os.path.join(str(root), cfg["sync"]["offline_db"]))
        if not cache.parent.is_dir():
            print("[SETUP REQUIRED] The offline database directory does not exist")
            return 1
        with tempfile.TemporaryFile(dir=cache.parent):
            pass
        if cache.exists():
            db = sqlite3.connect(cache.resolve().as_uri() + "?mode=ro", uri=True)
            try:
                if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
                    print("[ERROR] Local cache integrity check failed. Preserve the database for recovery.")
                    return 1
            finally:
                db.close()
        print("[OK] Python, SSL, SQLite, device library, configuration and storage checks passed.")
        print("[INFO] This is an offline check. Verify the real terminal with test-connection.bat.")
        return 0
    except Exception as error:
        print(f"[ERROR] Setup check failed ({type(error).__name__}). Check config.json and folder permissions.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
