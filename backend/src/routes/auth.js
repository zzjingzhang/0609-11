const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { run, get: dbGet } = require('../db/database');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
  }

  const user = dbGet('SELECT * FROM users WHERE username = ?', [username]);

  if (!user) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ code: 403, message: '账号已被禁用' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }

  const token = generateToken({
    id: user.id,
    username: user.username,
    real_name: user.real_name,
    role: user.role
  });

  logOperation(user.id, user.username, 'POST /api/auth/login', 'auth', '用户登录', req.ip);

  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      user: {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        role: user.role
      }
    }
  });
});

router.post('/register', (req, res) => {
  const { username, password, real_name } = req.body;
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
  }

  const existing = dbGet('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) {
    return res.status(400).json({ code: 400, message: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = run('INSERT INTO users (username, password, real_name, role, status) VALUES (?, ?, ?, ?, ?)',
    [username, hashedPassword, real_name || username, 'user', 'active']);

  logOperation(result.lastInsertRowid, username, 'POST /api/auth/register', 'auth', '用户注册', req.ip);

  res.json({ code: 200, message: '注册成功' });
});

router.get('/info', authMiddleware, (req, res) => {
  const user = dbGet('SELECT id, username, real_name, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    return res.status(404).json({ code: 404, message: '用户不存在' });
  }
  res.json({ code: 200, data: user });
});

module.exports = router;
