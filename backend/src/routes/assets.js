const express = require('express');
const router = express.Router();
const { run, get: dbGet, all } = require('../db/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const VALID_STATUSES = ['idle', 'borrowed', 'in_repair', 'scrapped', 'scrap_pending'];
const STATUS_LABELS = {
  'idle': '闲置',
  'borrowed': '已借出',
  'in_repair': '维修中',
  'scrapped': '已报废',
  'scrap_pending': '报废审批中'
};

function generateAssetCode() {
  const countRow = dbGet('SELECT COUNT(*) as count FROM assets');
  const count = countRow.count;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `AST${dateStr}${String(count + 1).padStart(4, '0')}`;
}

router.get('/', authMiddleware, (req, res) => {
  const { keyword, category_id, status, page = 1, pageSize = 20 } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const offset = (pageNum - 1) * size;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    whereClause += ' AND (a.code LIKE ? OR a.name LIKE ? OR a.model LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (category_id) {
    whereClause += ' AND a.category_id = ?';
    params.push(category_id);
  }
  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }

  const totalRow = dbGet(`SELECT COUNT(*) as count FROM assets a ${whereClause}`, params);
  const total = totalRow.count;

  const assets = all(`
    SELECT a.*, c.name as category_name, u.real_name as creator_name
    FROM assets a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.created_by = u.id
    ${whereClause}
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `, [...params, size, offset]);

  res.json({
    code: 200,
    data: {
      list: assets,
      total,
      page: pageNum,
      pageSize: size,
      statusLabels: STATUS_LABELS
    }
  });
});

router.get('/:id', authMiddleware, (req, res) => {
  const asset = dbGet(`
    SELECT a.*, c.name as category_name, u.real_name as creator_name
    FROM assets a
    LEFT JOIN categories c ON a.category_id = c.id
    LEFT JOIN users u ON a.created_by = u.id
    WHERE a.id = ?
  `, [req.params.id]);

  if (!asset) {
    return res.status(404).json({ code: 404, message: '资产不存在' });
  }

  res.json({ code: 200, data: asset });
});

router.post('/', authMiddleware, (req, res) => {
  const { name, category_id, model, brand, purchase_date, purchase_price, location, description } = req.body;

  if (!name || !category_id) {
    return res.status(400).json({ code: 400, message: '资产名称和分类不能为空' });
  }

  const code = generateAssetCode();

  const result = run(`
    INSERT INTO assets (code, name, category_id, model, brand, purchase_date, purchase_price, status, location, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'idle', ?, ?, ?)
  `, [code, name, category_id, model || '', brand || '', purchase_date || '', purchase_price || 0, location || '', description || '', req.user.id]);

  res.json({ code: 200, message: '资产登记成功', data: { id: result.lastInsertRowid, code } });
});

router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, category_id, model, brand, purchase_date, purchase_price, location, description } = req.body;

  run(`
    UPDATE assets SET name = ?, category_id = ?, model = ?, brand = ?, 
    purchase_date = ?, purchase_price = ?, location = ?, description = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [name, category_id, model || '', brand || '', purchase_date || '', purchase_price || 0, location || '', description || '', id]);

  res.json({ code: 200, message: '资产更新成功' });
});

router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  const asset = dbGet('SELECT status FROM assets WHERE id = ?', [id]);
  if (!asset) {
    return res.status(404).json({ code: 404, message: '资产不存在' });
  }

  if (asset.status === 'borrowed') {
    return res.status(400).json({ code: 400, message: '资产已被借出，无法删除' });
  }

  run('DELETE FROM assets WHERE id = ?', [id]);
  res.json({ code: 200, message: '资产删除成功' });
});

router.put('/:id/status', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ code: 400, message: '无效的状态值' });
  }

  const asset = dbGet('SELECT status FROM assets WHERE id = ?', [id]);
  if (!asset) {
    return res.status(404).json({ code: 404, message: '资产不存在' });
  }

  const transitions = {
    'idle': ['borrowed', 'scrap_pending', 'in_repair'],
    'borrowed': ['idle'],
    'in_repair': ['idle', 'scrap_pending'],
    'scrap_pending': ['scrapped', 'idle'],
    'scrapped': []
  };

  const allowed = transitions[asset.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      code: 400,
      message: `资产状态不允许从"${STATUS_LABELS[asset.status]}"变更为"${STATUS_LABELS[status]}"`,
      currentStatus: asset.status,
      allowedTransitions: allowed
    });
  }

  run('UPDATE assets SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
  res.json({ code: 200, message: `资产状态已变更为"${STATUS_LABELS[status]}"` });
});

module.exports = router;
