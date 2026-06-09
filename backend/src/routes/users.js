const express = require('express');
const router = express.Router();
const { run, get: dbGet, all } = require('../db/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, (req, res) => {
  const { keyword, role, status, page = 1, pageSize = 20 } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const offset = (pageNum - 1) * size;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    whereClause += ' AND (username LIKE ? OR real_name LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (role) {
    whereClause += ' AND role = ?';
    params.push(role);
  }
  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  const totalRow = dbGet(`SELECT COUNT(*) as count FROM users ${whereClause}`, params);
  const total = totalRow.count;

  const users = all(
    `SELECT id, username, real_name, role, status, created_at, updated_at
    FROM users ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?`,
    [...params, size, offset]
  );

  res.json({
    code: 200,
    data: { list: users, total, page: pageNum, pageSize: size }
  });
});

router.put('/:id/status', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ code: 400, message: '无效的状态值' });
  }

  run('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
  res.json({ code: 200, message: '状态更新成功' });
});

router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;
  const { real_name, role } = req.body;

  run('UPDATE users SET real_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [real_name, role, id]);

  res.json({ code: 200, message: '更新成功' });
});

router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ code: 400, message: '不能删除自己' });
  }

  run('DELETE FROM users WHERE id = ?', [id]);
  res.json({ code: 200, message: '删除成功' });
});

router.put('/:id/password', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ code: 400, message: '新密码不能为空' });
  }

  if (parseInt(id) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '权限不足' });
  }

  const user = dbGet('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }

  if (parseInt(id) === req.user.id) {
    const bcrypt = require('bcryptjs');
    if (!bcrypt.compareSync(oldPassword, user.password)) {
      return res.status(400).json({ code: 400, message: '原密码错误' });
    }
  }

  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  run('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, id]);

  res.json({ code: 200, message: '密码修改成功' });
});

module.exports = router;
