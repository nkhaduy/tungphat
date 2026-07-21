type SessionRow = { session_hash: string; username: string; csrf_hash: string; created_at: number; expires_at: number; last_seen_at: number };
type AttemptRow = { client_hash: string; failure_count: number; window_started_at: number; locked_until: number; updated_at: number };
type GitObjectRow = { session_hash: string; object_sha: string; object_kind: string; created_at: number; expires_at: number };

export class FakeD1 {
  sessions = new Map<string, SessionRow>();
  attempts = new Map<string, AttemptRow>();
  gitObjects = new Map<string, GitObjectRow>();

  prepare(sql: string) {
    const normalized = sql.replace(/\s+/g, " ").trim();
    let values: unknown[] = [];
    const statement = {
      bind: (...input: unknown[]) => { values = input; return statement; },
      first: async <T>() => {
        if (normalized.includes("FROM cms_sessions")) {
          const row = this.sessions.get(String(values[0]));
          if (!row || row.expires_at <= Number(values[1] || 0)) return null;
          return { username: row.username, csrf_hash: row.csrf_hash, expires_at: row.expires_at } as T;
        }
        if (normalized.includes("FROM cms_login_attempts")) {
          return (this.attempts.get(String(values[0])) || null) as T | null;
        }
        if (normalized.includes("FROM cms_git_objects")) {
          const row = this.gitObjects.get(`${values[0]}:${values[1]}`);
          if (!row || row.object_kind !== values[2] || row.expires_at <= Number(values[3])) return null;
          return { object_sha: row.object_sha } as T;
        }
        return null;
      },
      run: async () => {
        if (normalized.startsWith("INSERT INTO cms_sessions")) {
          const [session_hash, username, csrf_hash, created_at, expires_at] = values as [string, string, string, number, number];
          this.sessions.set(session_hash, { session_hash, username, csrf_hash, created_at, expires_at, last_seen_at: created_at });
        } else if (normalized.startsWith("DELETE FROM cms_sessions")) {
          this.sessions.delete(String(values[0]));
        } else if (normalized.startsWith("INSERT INTO cms_login_attempts")) {
          const [client_hash, failure_count, window_started_at, locked_until, updated_at] = values as [string, number, number, number, number];
          this.attempts.set(client_hash, { client_hash, failure_count, window_started_at, locked_until, updated_at });
        } else if (normalized.startsWith("DELETE FROM cms_login_attempts")) {
          this.attempts.delete(String(values[0]));
        } else if (normalized.startsWith("INSERT INTO cms_git_objects")) {
          const [session_hash, object_sha, object_kind, created_at, expires_at] = values as [string, string, string, number, number];
          this.gitObjects.set(`${session_hash}:${object_sha}`, { session_hash, object_sha, object_kind, created_at, expires_at });
        } else if (normalized.startsWith("DELETE FROM cms_git_objects")) {
          for (const [key, row] of this.gitObjects) if (row.session_hash === values[0]) this.gitObjects.delete(key);
        }
        return { success: true };
      },
      all: async () => ({ results: [] }),
    };
    return statement;
  }
}

export function asD1(database: FakeD1) {
  return database as unknown as D1Database;
}
