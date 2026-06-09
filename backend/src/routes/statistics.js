const express = require('express');
const router = express.Router();
const { get: dbGet, all } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

router.get('/overview', authMiddleware, (req, res) => {
  const totalAssets = dbGet('SELECT COUNT(*) as count FROM assets').count;
  const idleAssets = dbGet("SELECT COUNT(*) as count FROM assets WHERE status = 'idle'").count;
  const borrowedAssets = dbGet("SELECT COUNT(*) as count FROM assets WHERE status = 'borrowed'").count;
  const inRepairAssets = dbGet("SELECT COUNT(*) as count FROM assets WHERE status = 'in_repair'").count;
  const scrappedAssets = dbGet("SELECT COUNT(*) as count FROM assets WHERE status = 'scrapped'").count;
  const scrapPendingAssets = dbGet("SELECT COUNT(*) as count FROM assets WHERE status = 'scrap_pending'").count;

  const totalValue = dbGet('SELECT COALESCE(SUM(purchase_price), 0) as total FROM assets').total;
  const activeValue = dbGet("SELECT COALESCE(SUM(purchase_price), 0) as total FROM assets WHERE status NOT IN ('scrapped')").total;

  res.json({
    code: 200,
    data: {
      totalAssets,
      idleAssets,
      borrowedAssets,
      inRepairAssets,
      scrappedAssets,
      scrapPendingAssets,
      totalValue,
      activeValue
    }
  });
});

router.get('/by-category', authMiddleware, (req, res) => {
  const stats = all(`
    SELECT c.name as category_name, 
           COUNT(a.id) as asset_count,
           COALESCE(SUM(a.purchase_price), 0) as total_value
    FROM categories c
    LEFT JOIN assets a ON c.id = a.category_id AND a.status != 'scrapped'
    GROUP BY c.id, c.name
    ORDER BY asset_count DESC
  `);

  res.json({ code: 200, data: stats });
});

router.get('/by-status', authMiddleware, (req, res) => {
  const stats = all(`
    SELECT status, COUNT(*) as count, COALESCE(SUM(purchase_price), 0) as total_value
    FROM assets
    GROUP BY status
    ORDER BY count DESC
  `);

  const statusLabels = {
    'idle': '闲置',
    'borrowed': '已借出',
    'in_repair': '维修中',
    'scrapped': '已报废',
    'scrap_pending': '报废审批中'
  };

  const result = stats.map(s => ({
    ...s,
    label: statusLabels[s.status] || s.status
  }));

  res.json({ code: 200, data: result });
});

router.get('/borrow-trend', authMiddleware, (req, res) => {
  const { days = 30 } = req.query;
  const stats = all(`
    SELECT DATE(borrow_date) as date, COUNT(*) as count
    FROM borrow_records
    WHERE borrow_date >= DATE('now', '-' || ? || ' days')
    GROUP BY DATE(borrow_date)
    ORDER BY date ASC
  `, [days]);

  res.json({ code: 200, data: stats });
});

router.get('/recent-borrows', authMiddleware, (req, res) => {
  const records = all(`
    SELECT br.*, a.code as asset_code, a.name as asset_name, u.real_name as borrower_name
    FROM borrow_records br
    LEFT JOIN assets a ON br.asset_id = a.id
    LEFT JOIN users u ON br.borrower_id = u.id
    ORDER BY br.id DESC
    LIMIT 10
  `);

  res.json({ code: 200, data: records });
});

router.get('/recent-scraps', authMiddleware, (req, res) => {
  const records = all(`
    SELECT sr.*, a.code as asset_code, a.name as asset_name, u.real_name as applicant_name
    FROM scrap_records sr
    LEFT JOIN assets a ON sr.asset_id = a.id
    LEFT JOIN users u ON sr.applicant_id = u.id
    ORDER BY sr.id DESC
    LIMIT 10
  `);

  res.json({ code: 200, data: records });
});

module.exports = router;
