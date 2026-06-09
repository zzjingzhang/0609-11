const express = require('express');
const router = express.Router();
const { run, get: dbGet, all, transaction } = require('../db/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, (req, res) => {
  const { asset_id, reason } = req.body;

  if (!asset_id) {
    return res.status(400).json({ code: 400, message: '资产ID不能为空' });
  }

  const asset = dbGet('SELECT status FROM assets WHERE id = ?', [asset_id]);
  if (!asset) {
    return res.status(404).json({ code: 404, message: '资产不存在' });
  }

  if (!['idle', 'in_repair'].includes(asset.status)) {
    return res.status(400).json({ code: 400, message: '仅闲置或维修中的资产可申请报废' });
  }

  const result = transaction(() => {
    run("UPDATE assets SET status = 'scrap_pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [asset_id]);
    return run(`
      INSERT INTO scrap_records (asset_id, applicant_id, reason, status)
      VALUES (?, ?, ?, 'pending')
    `, [asset_id, req.user.id, reason || '']);
  });

  res.json({ code: 200, message: '报废申请已提交，资产状态已自动变更为"报废审批中"', data: { id: result.lastInsertRowid } });
});

router.put('/:id/approve', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  const record = dbGet('SELECT * FROM scrap_records WHERE id = ?', [id]);
  if (!record) {
    return res.status(404).json({ code: 404, message: '报废记录不存在' });
  }

  if (record.status !== 'pending') {
    return res.status(400).json({ code: 400, message: '该报废申请已处理' });
  }

  transaction(() => {
    run(`
      UPDATE scrap_records SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [req.user.id, id]);
    run("UPDATE assets SET status = 'scrapped', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [record.asset_id]);
  });

  res.json({ code: 200, message: '报废申请已批准，资产状态已自动变更为"已报废"' });
});

router.put('/:id/reject', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  const record = dbGet('SELECT * FROM scrap_records WHERE id = ?', [id]);
  if (!record) {
    return res.status(404).json({ code: 404, message: '报废记录不存在' });
  }

  if (record.status !== 'pending') {
    return res.status(400).json({ code: 400, message: '该报废申请已处理' });
  }

  transaction(() => {
    run(`
      UPDATE scrap_records SET status = 'rejected', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [req.user.id, id]);
    run("UPDATE assets SET status = 'idle', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [record.asset_id]);
  });

  res.json({ code: 200, message: '报废申请已驳回，资产状态已自动恢复为"闲置"' });
});

router.get('/', authMiddleware, (req, res) => {
  const { keyword, status, page = 1, pageSize = 20 } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const offset = (pageNum - 1) * size;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    whereClause += ' AND (a.code LIKE ? OR a.name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (status) {
    whereClause += ' AND sr.status = ?';
    params.push(status);
  }

  const totalRow = dbGet(`
    SELECT COUNT(*) as count FROM scrap_records sr
    LEFT JOIN assets a ON sr.asset_id = a.id
    ${whereClause}
  `, params);
  const total = totalRow.count;

  const records = all(`
    SELECT sr.*, a.code as asset_code, a.name as asset_name, a.model as asset_model,
           u.real_name as applicant_name,
           au.real_name as approver_name
    FROM scrap_records sr
    LEFT JOIN assets a ON sr.asset_id = a.id
    LEFT JOIN users u ON sr.applicant_id = u.id
    LEFT JOIN users au ON sr.approved_by = au.id
    ${whereClause}
    ORDER BY sr.id DESC
    LIMIT ? OFFSET ?
  `, [...params, size, offset]);

  res.json({
    code: 200,
    data: { list: records, total, page: pageNum, pageSize: size }
  });
});

module.exports = router;
