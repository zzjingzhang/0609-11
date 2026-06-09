const express = require('express');
const router = express.Router();
const { run, get: dbGet, all, transaction, saveDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, (req, res) => {
  const { asset_id, borrow_date, expected_return_date, remark } = req.body;

  if (!asset_id || !borrow_date) {
    return res.status(400).json({ code: 400, message: '资产ID和借用日期不能为空' });
  }

  const asset = dbGet('SELECT status FROM assets WHERE id = ?', [asset_id]);
  if (!asset) {
    return res.status(404).json({ code: 404, message: '资产不存在' });
  }

  if (asset.status !== 'idle') {
    return res.status(400).json({ code: 400, message: '资产当前状态不可借用，仅闲置状态可借用' });
  }

  const result = transaction(() => {
    run("UPDATE assets SET status = 'borrowed', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [asset_id]);
    return run(`
      INSERT INTO borrow_records (asset_id, borrower_id, borrow_date, expected_return_date, status, remark)
      VALUES (?, ?, ?, ?, 'borrowed', ?)
    `, [asset_id, req.user.id, borrow_date, expected_return_date || '', remark || '']);
  });

  res.json({ code: 200, message: '借用成功，资产状态已自动变更为"已借出"', data: { id: result.lastInsertRowid } });
});

router.post('/:id/return', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { actual_return_date, remark } = req.body;

  const record = dbGet('SELECT * FROM borrow_records WHERE id = ?', [id]);
  if (!record) {
    return res.status(404).json({ code: 404, message: '借用记录不存在' });
  }

  if (record.status !== 'borrowed') {
    return res.status(400).json({ code: 400, message: '该借用记录已归还' });
  }

  if (record.borrower_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '无权归还他人的借用记录，仅借用人本人或管理员可操作' });
  }

  const returnDate = actual_return_date || new Date().toISOString().slice(0, 10);

  transaction(() => {
    run(`
      UPDATE borrow_records SET status = 'returned', actual_return_date = ?, remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [returnDate, remark || record.remark, id]);
    run("UPDATE assets SET status = 'idle', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [record.asset_id]);
  });

  res.json({ code: 200, message: '归还成功，资产状态已自动变更为"闲置"' });
});

router.get('/', authMiddleware, (req, res) => {
  const { keyword, status, page = 1, pageSize = 20 } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const offset = (pageNum - 1) * size;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    whereClause += ' AND (a.code LIKE ? OR a.name LIKE ? OR u.real_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (status) {
    whereClause += ' AND br.status = ?';
    params.push(status);
  }

  const totalRow = dbGet(`
    SELECT COUNT(*) as count FROM borrow_records br
    LEFT JOIN assets a ON br.asset_id = a.id
    LEFT JOIN users u ON br.borrower_id = u.id
    ${whereClause}
  `, params);
  const total = totalRow.count;

  const records = all(`
    SELECT br.*, a.code as asset_code, a.name as asset_name, a.model as asset_model,
           u.real_name as borrower_name,
           au.real_name as asset_creator_name
    FROM borrow_records br
    LEFT JOIN assets a ON br.asset_id = a.id
    LEFT JOIN users u ON br.borrower_id = u.id
    LEFT JOIN users au ON a.created_by = au.id
    ${whereClause}
    ORDER BY br.id DESC
    LIMIT ? OFFSET ?
  `, [...params, size, offset]);

  res.json({
    code: 200,
    data: { list: records, total, page: pageNum, pageSize: size }
  });
});

router.get('/my', authMiddleware, (req, res) => {
  const { status, page = 1, pageSize = 20 } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const offset = (pageNum - 1) * size;

  let whereClause = 'WHERE br.borrower_id = ?';
  const params = [req.user.id];

  if (status) {
    whereClause += ' AND br.status = ?';
    params.push(status);
  }

  const totalRow = dbGet(`SELECT COUNT(*) as count FROM borrow_records br ${whereClause}`, params);
  const total = totalRow.count;

  const records = all(`
    SELECT br.*, a.code as asset_code, a.name as asset_name, a.model as asset_model
    FROM borrow_records br
    LEFT JOIN assets a ON br.asset_id = a.id
    ${whereClause}
    ORDER BY br.id DESC
    LIMIT ? OFFSET ?
  `, [...params, size, offset]);

  res.json({
    code: 200,
    data: { list: records, total, page: pageNum, pageSize: size }
  });
});

module.exports = router;
