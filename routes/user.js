const express = require('express');
const router = express.Router();
const db = require('../db');

// 登录/注册
router.post('/login', async (req, res) => {
  try {
    const { openid, nickname, avatar } = req.body;
    let user = await db.query('SELECT * FROM users WHERE wx_openid = $1', [openid]);
    if (user.rows.length === 0) {
      await db.query(
        'INSERT INTO users (wx_openid, nickname, avatar) VALUES ($1, $2, $3)',
        [openid, nickname, avatar]
      );
      user = await db.query('SELECT * FROM users WHERE wx_openid = $1', [openid]);
    }
    res.json({ code: 0, data: user.rows[0] });
  } catch (e) {
    console.error(e);
    res.json({ code: -1 });
  }
});

module.exports = router;
