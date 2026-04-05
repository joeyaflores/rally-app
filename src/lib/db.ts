import Database from "better-sqlite3";

function getDbPath() {
  if (process.env.NODE_ENV !== "production") return "local.db";
  try {
    const fs = require("fs");
    if (fs.existsSync("/data")) return "/data/auth.db";
  } catch {}
  return "/tmp/auth.db";
}

let _db: InstanceType<typeof Database> | null = null;

export function getDb() {
  if (!_db) {
    _db = new Database(getDbPath());
    _db.exec(`
      CREATE TABLE IF NOT EXISTS "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" integer not null, "image" text, "createdAt" date not null, "updatedAt" date not null);
      CREATE TABLE IF NOT EXISTS "session" ("id" text not null primary key, "expiresAt" date not null, "token" text not null unique, "createdAt" date not null, "updatedAt" date not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade);
      CREATE TABLE IF NOT EXISTS "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" date, "refreshTokenExpiresAt" date, "scope" text, "password" text, "createdAt" date not null, "updatedAt" date not null);
      CREATE TABLE IF NOT EXISTS "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" date not null, "createdAt" date not null, "updatedAt" date not null);
      CREATE TABLE IF NOT EXISTS "sheet_cache" ("key" text primary key, "value" text not null, "updated_at" text not null);

      CREATE TABLE IF NOT EXISTS platform_metrics (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        metrics TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(platform, year, month)
      );

      CREATE TABLE IF NOT EXISTS attendance_events (
        id TEXT PRIMARY KEY,
        event_date TEXT NOT NULL UNIQUE,
        day TEXT NOT NULL,
        attendance INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS metric_snapshots (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        metrics TEXT NOT NULL,
        recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS content_posts (
        id TEXT PRIMARY KEY,
        post_date TEXT NOT NULL,
        platform TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        caption TEXT NOT NULL DEFAULT '',
        creator TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'idea',
        scope TEXT NOT NULL DEFAULT 'club',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        checklist TEXT NOT NULL DEFAULT '[]',
        pinned INTEGER NOT NULL DEFAULT 0,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS boards (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        board_type TEXT NOT NULL DEFAULT 'general',
        cover_url TEXT NOT NULL DEFAULT '',
        event_date TEXT,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS board_items (
        id TEXT PRIMARY KEY,
        board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        item_type TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_board_items_board_id ON board_items(board_id);

      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        brand TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'other',
        relationship TEXT NOT NULL DEFAULT 'prospect',
        notes TEXT NOT NULL DEFAULT '',
        collab_count INTEGER NOT NULL DEFAULT 0,
        last_collab TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_contacts_category ON contacts(category, brand);

      CREATE TABLE IF NOT EXISTS subscribers (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS checkin_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        subtitle TEXT NOT NULL DEFAULT '',
        theme TEXT NOT NULL DEFAULT 'navy',
        image_url TEXT NOT NULL DEFAULT '',
        event_details TEXT NOT NULL DEFAULT '',
        session_date TEXT NOT NULL,
        day TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        opened_at TEXT NOT NULL DEFAULT (datetime('now')),
        closed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS checkins (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES checkin_sessions(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        first_name TEXT NOT NULL DEFAULT '',
        last_name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        checked_in_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(session_id, email)
      );

      CREATE INDEX IF NOT EXISTS idx_checkins_session_id ON checkins(session_id);

      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        first_name TEXT NOT NULL DEFAULT '',
        last_name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL DEFAULT '',
        first_checkin TEXT NOT NULL,
        last_checkin TEXT NOT NULL,
        total_checkins INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS event_reports (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL DEFAULT '',
        event_date TEXT NOT NULL,
        location TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        session_id TEXT,
        board_id TEXT,
        hero_image_url TEXT NOT NULL DEFAULT '',
        highlights TEXT NOT NULL DEFAULT '[]',
        sponsors TEXT NOT NULL DEFAULT '[]',
        content_start TEXT,
        content_end TEXT,
        metrics_year INTEGER,
        metrics_month INTEGER,
        published INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS social_posts (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        external_id TEXT NOT NULL,
        url TEXT NOT NULL DEFAULT '',
        caption TEXT NOT NULL DEFAULT '',
        thumbnail_url TEXT NOT NULL DEFAULT '',
        post_type TEXT NOT NULL DEFAULT '',
        hashtags TEXT NOT NULL DEFAULT '[]',
        mentions TEXT NOT NULL DEFAULT '[]',
        posted_at TEXT NOT NULL DEFAULT '',
        views INTEGER NOT NULL DEFAULT 0,
        likes INTEGER NOT NULL DEFAULT 0,
        comments INTEGER NOT NULL DEFAULT 0,
        shares INTEGER NOT NULL DEFAULT 0,
        duration INTEGER NOT NULL DEFAULT 0,
        location TEXT NOT NULL DEFAULT '',
        music TEXT NOT NULL DEFAULT '',
        dimensions_height INTEGER NOT NULL DEFAULT 0,
        dimensions_width INTEGER NOT NULL DEFAULT 0,
        scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(platform, external_id)
      );
    `);

    // Migrations
    const cols = _db.pragma("table_info(attendance_events)") as { name: string }[];
    if (!cols.some((c) => c.name === "note")) {
      _db.exec("ALTER TABLE attendance_events ADD COLUMN note TEXT NOT NULL DEFAULT ''");
    }

    const contactCols = _db.pragma("table_info(contacts)") as { name: string }[];
    if (contactCols.some((c) => c.name === "tier") && !contactCols.some((c) => c.name === "relationship")) {
      _db.exec("ALTER TABLE contacts ADD COLUMN relationship TEXT NOT NULL DEFAULT 'prospect'");
      _db.exec(`UPDATE contacts SET relationship = CASE
        WHEN status = 'active' THEN 'active'
        WHEN status = 'reached-out' THEN 'reached-out'
        WHEN status = 'past' THEN 'inactive'
        ELSE 'prospect'
      END`);
    }

    // Per-column migration helper — try/catch guards against build-time worker races.
    const addCol = (table: string, col: string, def: string) => {
      const cols = _db!.pragma(`table_info(${table})`) as { name: string }[];
      if (cols.some((c) => c.name === col)) return;
      try { _db!.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch {}
    };

    // Add subtitle, theme, image_url to checkin_sessions.
    addCol("checkin_sessions", "subtitle", "TEXT NOT NULL DEFAULT ''");
    addCol("checkin_sessions", "theme", "TEXT NOT NULL DEFAULT 'navy'");
    addCol("checkin_sessions", "image_url", "TEXT NOT NULL DEFAULT ''");
    addCol("checkin_sessions", "event_details", "TEXT NOT NULL DEFAULT ''");

    // Add first_name, last_name, phone to checkins + members.
    for (const t of ["checkins", "members"] as const) {
      addCol(t, "first_name", "TEXT NOT NULL DEFAULT ''");
      addCol(t, "last_name", "TEXT NOT NULL DEFAULT ''");
      addCol(t, "phone", "TEXT NOT NULL DEFAULT ''");
    }
    _db.exec("UPDATE checkins SET first_name = name WHERE first_name = ''");
    _db.exec("UPDATE members SET first_name = name WHERE first_name = ''");

    addCol("event_reports", "images", "TEXT NOT NULL DEFAULT '[]'");
    addCol("social_posts", "latest_comments", "TEXT NOT NULL DEFAULT '[]'");
    addCol("event_reports", "excluded_post_ids", "TEXT NOT NULL DEFAULT '[]'");
    addCol("event_reports", "drive_url", "TEXT NOT NULL DEFAULT ''");

    // ─── Indexes (CREATE IF NOT EXISTS is idempotent) ───
    const addIdx = (sql: string) => { try { _db!.exec(sql); } catch {} };

    // Reports: session lookup + token/published filter
    addIdx("CREATE INDEX IF NOT EXISTS idx_event_reports_session_id ON event_reports(session_id)");

    // Checkin sessions: status filter (getOpenSession, getActiveSession, openCheckinSession)
    addIdx("CREATE INDEX IF NOT EXISTS idx_checkin_sessions_status ON checkin_sessions(status)");

    // Platform metrics: (platform, year, month) already has UNIQUE constraint → implicit index. OK.
    // Attendance events: event_date range queries (getMonthData, dashboard)
    addIdx("CREATE INDEX IF NOT EXISTS idx_attendance_events_event_date ON attendance_events(event_date)");

    // Metric snapshots: (year, month) filter
    addIdx("CREATE INDEX IF NOT EXISTS idx_metric_snapshots_year_month ON metric_snapshots(year, month)");

    // Content posts: post_date range + scope filter
    addIdx("CREATE INDEX IF NOT EXISTS idx_content_posts_post_date ON content_posts(post_date)");

    // Notes: archived + pinned queries
    addIdx("CREATE INDEX IF NOT EXISTS idx_notes_archived_pinned ON notes(archived, pinned)");

    // Social posts: platform + posted_at for recent post queries
    addIdx("CREATE INDEX IF NOT EXISTS idx_social_posts_platform_posted ON social_posts(platform, posted_at)");

    // Metric snapshots: platform + recorded_at for getLatestSnapshots self-join
    addIdx("CREATE INDEX IF NOT EXISTS idx_metric_snapshots_platform_ts ON metric_snapshots(platform, recorded_at)");

    // ─── Dedup social_posts: profile scraper + post scraper may have created
    //     duplicate rows for the same IG post with different external_id formats.
    //     Keep the row with the latest scraped_at per (platform, url). ───
    try {
      const dupeCount = (_db.prepare(
        `SELECT COUNT(*) as n FROM social_posts
         WHERE url != '' AND id NOT IN (
           SELECT id FROM (
             SELECT id, ROW_NUMBER() OVER (
               PARTITION BY platform, url ORDER BY scraped_at DESC
             ) as rn FROM social_posts WHERE url != ''
           ) WHERE rn = 1
         )`
      ).get() as { n: number }).n;
      if (dupeCount > 0) {
        _db.exec(
          `DELETE FROM social_posts
           WHERE url != '' AND id NOT IN (
             SELECT id FROM (
               SELECT id, ROW_NUMBER() OVER (
                 PARTITION BY platform, url ORDER BY scraped_at DESC
               ) as rn FROM social_posts WHERE url != ''
             ) WHERE rn = 1
           )`
        );
      }
    } catch {}

    const postCols = _db.pragma("table_info(content_posts)") as { name: string }[];
    if (!postCols.some((c) => c.name === "scope")) {
      _db.exec("ALTER TABLE content_posts ADD COLUMN scope TEXT NOT NULL DEFAULT 'club'");
    }
    if (!postCols.some((c) => c.name === "title")) {
      _db.exec("ALTER TABLE content_posts ADD COLUMN title TEXT NOT NULL DEFAULT ''");
      _db.exec("ALTER TABLE content_posts ADD COLUMN body TEXT NOT NULL DEFAULT ''");
      _db.exec("ALTER TABLE content_posts ADD COLUMN caption TEXT NOT NULL DEFAULT ''");
      _db.exec("ALTER TABLE content_posts ADD COLUMN creator TEXT NOT NULL DEFAULT ''");
      _db.exec("UPDATE content_posts SET title = content WHERE title = ''");
    }
  }
  return _db;
}
