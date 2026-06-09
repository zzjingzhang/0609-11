const { run } = require('../db/database');

function logOperation(userId, username, action, module, detail, ip) {
  run(`
    INSERT INTO operation_logs (user_id, username, action, module, detail, ip)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [userId, username, action, module, detail, ip || '']);
}

function logMiddleware(req, res, next) {
  const originalEnd = res.end;
  res.end = function (...args) {
    if (req.user && req.method !== 'GET') {
      const action = `${req.method} ${req.originalUrl}`;
      let detail = '';
      try {
        detail = JSON.stringify(req.body || {});
        if (detail.length > 500) detail = detail.substring(0, 500) + '...';
      } catch (e) {
        detail = '';
      }
      logOperation(
        req.user.id,
        req.user.username,
        action,
        req.baseUrl.replace('/api/', '') || 'other',
        detail,
        req.ip
      );
    }
    originalEnd.apply(res, args);
  };
  next();
}

module.exports = { logOperation, logMiddleware };
