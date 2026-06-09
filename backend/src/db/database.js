const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'asset.db');
const DB_DIR = path.dirname(DB_PATH);

let db = null;
let saveTimeout = null;
let SQL = null;

async function initDb() {
  if (db) return db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON;');

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save database:', err);
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveDb();
  }, 500);
}

function run(sql, params) {
  const database = getDb();
  try {
    database.run(sql, params);
    scheduleSave();
    return { lastInsertRowid: getLastInsertId() };
  } catch (err) {
    throw err;
  }
}

function getLastInsertId() {
  const result = getDb().exec('SELECT last_insert_rowid() as id');
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0];
  }
  return 0;
}

function get(sql, params) {
  const database = getDb();
  const stmt = database.prepare(sql);
  if (params) stmt.bind(params);
  const row = stmt.step() ? parseRow(stmt) : null;
  stmt.free();
  return row;
}

function all(sql, params) {
  const database = getDb();
  const stmt = database.prepare(sql);
  if (params) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(parseRow(stmt));
  }
  stmt.free();
  return rows;
}

function parseRow(stmt) {
  const columns = stmt.getColumnNames();
  const values = stmt.get();
  const row = {};
  columns.forEach((col, i) => {
    row[col] = values[i];
  });
  return row;
}

function exec(sql) {
  const database = getDb();
  database.run(sql);
  scheduleSave();
}

function transaction(fn) {
  const database = getDb();
  database.run('BEGIN TRANSACTION');
  try {
    const result = fn();
    database.run('COMMIT');
    scheduleSave();
    return result;
  } catch (err) {
    database.run('ROLLBACK');
    throw err;
  }
}

function closeDb() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  saveDb();
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { initDb, getDb, saveDb, closeDb, run, get, all, exec, transaction, DB_PATH };
