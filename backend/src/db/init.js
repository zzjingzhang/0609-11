const { initDb, exec, run, get: dbGet, saveDb, closeDb } = require('./database');

function initDatabase() {
  exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT DEFAULT '',
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT '',
      parent_id INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      model TEXT DEFAULT '',
      brand TEXT DEFAULT '',
      purchase_date TEXT DEFAULT '',
      purchase_price REAL DEFAULT 0,
      status TEXT DEFAULT 'idle',
      location TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      borrower_id INTEGER NOT NULL,
      borrow_date TEXT NOT NULL,
      expected_return_date TEXT,
      actual_return_date TEXT,
      status TEXT DEFAULT 'borrowed',
      remark TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (borrower_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS scrap_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      applicant_id INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      approved_by INTEGER,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (applicant_id) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT DEFAULT '',
      action TEXT NOT NULL,
      module TEXT DEFAULT '',
      detail TEXT DEFAULT '',
      ip TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const bcrypt = require('bcryptjs');
  const userCount = dbGet('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const adminPassword = bcrypt.hashSync('admin123', 10);
    const userPassword = bcrypt.hashSync('user123', 10);

    run('INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)',
      ['admin', adminPassword, '系统管理员', 'admin', 'active']);

    run('INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)',
      ['user', userPassword, '普通用户', 'user', 'active']);

    const defaultCategories = [
      { name: '电子设备', description: '电脑、手机、平板等电子设备', parent_id: 0 },
      { name: '办公家具', description: '桌椅、柜子等办公家具', parent_id: 0 },
      { name: '交通工具', description: '汽车、电动车等交通工具', parent_id: 0 },
      { name: '软件许可', description: '各类软件授权和许可', parent_id: 0 },
      { name: '其他', description: '其他类别资产', parent_id: 0 }
    ];

    for (const cat of defaultCategories) {
      run('INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)',
        [cat.name, cat.description, cat.parent_id]);
    }

    saveDb();
    console.log('Database initialized with default admin and user accounts.');
    console.log('Admin account: admin / admin123');
    console.log('User account: user / user123');
  } else {
    console.log('Database already initialized.');
  }
}

if (require.main === module) {
  initDb().then(() => {
    initDatabase();
    closeDb();
    console.log('Database initialization complete.');
  }).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exitCode = 1;
  });
}

module.exports = { initDatabase };
