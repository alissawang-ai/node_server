const express = require('express');
const router = express.Router();
const db = require('../db');

// 创建团队
router.post('/create', async (req, res) => {
  try {
    const { creatorId, teamName, dailyLimitMin, deposit, maxMember } = req.body;
    await db.query(
      `INSERT INTO team 
      (creator_id, team_name, daily_limit_min, deposit, max_member) 
      VALUES ($1, $2, $3, $4, $5)`,
      [creatorId, teamName, dailyLimitMin, deposit, maxMember]
    );
    res.json({ code: 0, msg: '创建成功' });
  } catch (e) {
    console.error(e);
    res.json({ code: -1, msg: '创建失败' });
  }
});

// 加入团队
router.post('/join', async (req, res) => {
  try {
    const { teamId, userId } = req.body;
    await db.query(
      'INSERT INTO team_member (team_id, user_id, deposit_pay) VALUES ($1, $2, 0)',
      [teamId, userId]
    );
    res.json({ code: 0, msg: '加入成功，请缴纳押金' });
  } catch (e) {
    console.error(e);
    res.json({ code: -1, msg: '加入失败' });
  }
});

// 上传当日使用时长
router.post('/uploadUsage', async (req, res) => {
  try {
    const { userId, usageMin } = req.body;
    const member = await db.query(
      'SELECT * FROM team_member WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    if (member.rows.length === 0) return res.json({ code: -1, msg: '未加入团队' });

    const teamId = member.rows[0].team_id;
    const team = await db.query('SELECT * FROM team WHERE id = $1 LIMIT 1', [teamId]);
    if (team.rows.length === 0) return res.json({ code: -1 });

    const limit = team.rows[0].daily_limit_min;
    const status = usageMin > limit ? 2 : 1;

    await db.query(
      'UPDATE team_member SET today_use_min=$1, today_status=$2 WHERE user_id=$3',
      [usageMin, status, userId]
    );
    res.json({ code: 0, msg: '时长上传成功' });
  } catch (e) {
    console.error(e);
    res.json({ code: -1, msg: '上传失败' });
  }
});

module.exports = router;
