const express = require('express');
const router = express.Router();
const { run, get: dbGet, all } = require('../db/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  const { keyword, module, username, page = 1, pageSize = 20, start_date, end_date } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const offset = (pageNum - 1) * size;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    whereClause += ' AND (ol.action LIKE ? OR ol.detail LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (module) {
    whereClause += ' AND ol.module = ?';
    params.push(module);
  }
  if (username) {
    whereClause += ' AND ol.username LIKE ?';
    params.push(`%${username}%`);
  }
  if (start_date) {
    whereClause += ' AND ol.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    whereClause += ' AND ol.created_at <= ?';
    params.push(end_date + ' 23:59:59');
  }

  const totalRow = dbGet(`SELECT COUNT(*) as count FROM operation_logs ol ${whereClause}`, params);
  const total = totalRow.count;

  const logs = all(`
    SELECT ol.* FROM operation_logs ol
    ${whereClause}
    ORDER BY ol.id DESC
    LIMIT ? OFFSET ?
  `, [...params, size, offset]);

  res.json({
    code: 200,
    data: { list: logs, total, page: pageNum, pageSize: size }
  });
});

module.exports = router;
