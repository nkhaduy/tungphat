#!/usr/bin/env python3
"""Read-only logical SQLite and streaming upload comparison; not a restore drill."""
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import sys
from urllib.parse import quote


def digest_rows(connection, table):
    name = '"' + table.replace('"', '""') + '"'
    # Fail closed on tables without rowid; a future adapter can use primary-key order.
    result = hashlib.sha256()
    for row in connection.execute(f'SELECT * FROM {name} ORDER BY rowid'):
        encoded = repr(row).encode('utf-8')
        result.update(len(encoded).to_bytes(8, 'big'))
        result.update(encoded)
    return result.hexdigest()


def open_database(file):
    if not Path(file).is_file() or Path(file).is_symlink():
        raise ValueError('database missing or symbolic link')
    db = sqlite3.connect('file:' + quote(os.path.abspath(file)) + '?mode=ro', uri=True)
    db.execute('BEGIN')
    if db.execute('PRAGMA integrity_check').fetchall() != [('ok',)]:
        raise ValueError('database integrity check failed')
    return db


def inventory(root):
    root = Path(root)
    if not root.is_dir() or root.is_symlink():
        raise ValueError('uploads directory missing or symbolic link')
    result = {}
    for base, dirs, files in os.walk(root, followlinks=False):
        for name in dirs:
            if (Path(base) / name).is_symlink():
                raise ValueError('symbolic link in uploads')
        for name in files:
            file = Path(base) / name
            if file.is_symlink() or not file.is_file():
                raise ValueError('non-regular upload')
            digest = hashlib.sha256()
            with file.open('rb') as stream:
                for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                    digest.update(chunk)
            result[str(file.relative_to(root))] = digest.hexdigest()
    return result


def main():
    if len(sys.argv) != 5:
        raise ValueError('expected live-db live-uploads backup-db backup-uploads')
    live = open_database(sys.argv[1])
    backup = open_database(sys.argv[3])
    try:
        query = "SELECT type, name, tbl_name, sql FROM sqlite_master ORDER BY type, name"
        schemas_live = live.execute(query).fetchall()
        schemas_backup = backup.execute(query).fetchall()
        schema_match = schemas_live == schemas_backup
        different = []
        if schema_match:
            different = [name for kind, name, _, _ in schemas_live if kind == 'table' and digest_rows(live, name) != digest_rows(backup, name)]
        files_live, files_backup = inventory(sys.argv[2]), inventory(sys.argv[4])
        ok = schema_match and not different and files_live == files_backup
        print(json.dumps({'ok':ok,'integrity':'ok','schema_match':schema_match,'different_tables':different,'uploads_match':files_live==files_backup,'live_upload_count':len(files_live),'backup_upload_count':len(files_backup),'restore_tested':False}))
        return 0 if ok else 1
    finally:
        live.close()
        backup.close()


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception as error:
        print(json.dumps({'ok':False,'error':str(error),'restore_tested':False}))
        sys.exit(1)
