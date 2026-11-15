"""Database Restore Utility for SchemeSaathi

Restores:
- SQLite binary snapshot with pre-restore safety copy
- PostgreSQL SQL dump via psql
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings

def restore_database(backup_filepath: str):
    backup_path = Path(backup_filepath)
    if not backup_path.exists():
        print(f"[ERROR] Specified backup file does not exist: {backup_path}")
        sys.exit(1)

    db_url = settings.DATABASE_URL
    print(f"Initiating SchemeSaathi database restore from: {backup_path.name}")

    if "sqlite" in db_url:
        db_file = db_url.split("///")[-1].replace("./", "")
        target_path = backend_dir / db_file
        
        # Pre-restore safety backup if target exists
        if target_path.exists():
            pre_restore_backup = target_path.with_suffix(".pre_restore.bak")
            shutil.copy2(target_path, pre_restore_backup)
            print(f"Created pre-restore safety copy at: {pre_restore_backup.name}")

        shutil.copy2(backup_path, target_path)
        print(f"[SUCCESS] Database successfully restored from {backup_path.name} to {target_path.name}")

    elif "postgresql" in db_url:
        print(f"Executing psql restore for: {backup_path.name}")
        cmd = f"psql {settings.DATABASE_URL_SYNC} -f {backup_path}"
        try:
            subprocess.run(cmd, shell=True, check=True)
            print(f"[SUCCESS] PostgreSQL database successfully restored.")
        except Exception as e:
            print(f"[ERROR] psql restore failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python restore_db.py <path_to_backup_file>")
        sys.exit(1)
    restore_database(sys.argv[1])
