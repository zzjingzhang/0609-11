const express = require('express');
const router = express.Router();
const { run, get: dbGet, all } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, (req, res) => {
  const categories = all(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM assets WHERE category_id = c.id) as asset_count,
      p.name as parent_name
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
    ORDER BY c.id ASC
  `);
  res.json({ code: 200, data: categories });
});

router.post('/', authMiddleware, (req, res) => {
  const { name, description, parent_id } = req.body;

  if (!name) {
    return res.status(400).json({ code: 400, message: '分类名称不能为空' });
  }

  const existing = dbGet('SELECT id FROM categories WHERE name = ?', [name]);
  if (existing) {
    return res.status(400).json({ code: 400, message: '分类名称已存在' });
  }

  const result = run('INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)',
    [name, description || '', parent_id || 0]);

  res.json({ code: 200, message: '分类创建成功', data: { id: result.lastInsertRowid } });
});

router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, description, parent_id } = req.body;

  if (!name) {
    return res.status(400).json({ code: 400, message: '分类名称不能为空' });
  }

  run('UPDATE categories SET name = ?, description = ?, parent_id = ? WHERE id = ?',
    [name, description || '', parent_id || 0, id]);

  res.json({ code: 200, message: '分类更新成功' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  const assetCount = dbGet('SELECT COUNT(*) as count FROM assets WHERE category_id = ?', [id]).count;
  if (assetCount > 0) {
    return res.status(400).json({ code: 400, message: '该分类下还有资产，无法删除' });
  }

  run('DELETE FROM categories WHERE id = ?', [id]);
  res.json({ code: 200, message: '分类删除成功' });
});

module.exports = router;
