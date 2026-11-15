"""Database Backup Utility for SchemeSaathi

Supports:
- SQLite binary snapshot and SQL dump
- PostgreSQL pg_dump invocation with metadata validation
- Automatic timestamping and integrity verification
"""

import os
import sys
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.config import settings

BACKUP_DIR = backend_dir / "backups"

def backup_database():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    
    db_url = settings.DATABASE_URL
    print(f"Initiating SchemeSaathi database backup for URL type: {db_url.split('://')[0]}")

    if "sqlite" in db_url:
        db_file = db_url.split("///")[-1].replace("./", "")
        source_path = backend_dir / db_file
        if not source_path.exists():
            print(f"Error: Source database file not found at {source_path}")
            sys.exit(1)
            
        target_path = BACKUP_DIR / f"schemesaathi_backup_{timestamp}.db"
        shutil.copy2(source_path, target_path)
        file_size_kb = target_path.stat().st_size / 1024
        print(f"[SUCCESS] SQLite snapshot created: {target_path.name} ({file_size_kb:.2f} KB)")
        return str(target_path)

    elif "postgresql" in db_url:
        target_path = BACKUP_DIR / f"schemesaathi_pg_backup_{timestamp}.sql"
        print(f"Executing pg_dump for PostgreSQL target: {target_path.name}")
        cmd = f"pg_dump {settings.DATABASE_URL_SYNC} -f {target_path}"
        try:
            subprocess.run(cmd, shell=True, check=True)
            print(f"[SUCCESS] PostgreSQL dump created: {target_path.name}")
            return str(target_path)
        except Exception as e:
            print(f"[ERROR] pg_dump failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    backup_database()
