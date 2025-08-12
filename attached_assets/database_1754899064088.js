await db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      points INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      energy INTEGER DEFAULT 2000,
      max_energy INTEGER DEFAULT 2000,
      hourly_rate INTEGER DEFAULT 0,
      last_active INTEGER DEFAULT 0,
      last_wheel_spin INTEGER DEFAULT 0,
      selected_character_id TEXT,
      is_admin BOOLEAN DEFAULT FALSE,
      account_status TEXT DEFAULT 'active',
      ban_reason TEXT,
      ban_expires INTEGER,
      chat_enabled BOOLEAN DEFAULT TRUE,
      upgrade_enabled BOOLEAN DEFAULT TRUE,
      theme_settings TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (selected_character_id) REFERENCES characters (id)
    );

    -- Characters table
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bio TEXT,
      image_url TEXT,
      required_level INTEGER DEFAULT 1,
      bonus_type TEXT DEFAULT 'none',
      bonus_value REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User unlocked characters
    CREATE TABLE IF NOT EXISTS user_characters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (character_id) REFERENCES characters (id),
      UNIQUE(user_id, character_id)
    );

    -- Media files (images/videos)
    CREATE TABLE IF NOT EXISTS media_files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      url TEXT NOT NULL,
      size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      character_id TEXT,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (character_id) REFERENCES characters (id)
    );

    -- Chat logs
    CREATE TABLE IF NOT EXISTS chat_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      character_id TEXT NOT NULL,
      message TEXT,
      response TEXT,
      is_user_message BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (character_id) REFERENCES characters (id)
    );

    -- Upgrades table
    CREATE TABLE IF NOT EXISTS upgrades (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      base_cost INTEGER NOT NULL,
      max_level INTEGER DEFAULT 50,
      hourly_bonus INTEGER DEFAULT 0,
      tap_bonus INTEGER DEFAULT 0,
      icon TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User upgrades (purchased upgrades)
    CREATE TABLE IF NOT EXISTS user_upgrades (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      upgrade_id TEXT NOT NULL,
      level INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (upgrade_id) REFERENCES upgrades (id),
      UNIQUE(user_id, upgrade_id)
    );

    -- Wheel prizes
    CREATE TABLE IF NOT EXISTS wheel_prizes (
      id TEXT PRIMARY KEY,
      prize_type TEXT NOT NULL,
      amount INTEGER,
      rarity TEXT DEFAULT 'common',
      weight REAL DEFAULT 1.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Game stats
    CREATE TABLE IF NOT EXISTS game_stats (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      total_taps INTEGER DEFAULT 0,
      total_earned INTEGER DEFAULT 0,
      daily_spin_used DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Error logs
    CREATE TABLE IF NOT EXISTS error_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      error_message TEXT NOT NULL,
      stack_trace TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Game settings
    CREATE TABLE IF NOT EXISTS game_settings (
      id TEXT PRIMARY KEY,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);