const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
const moment = require('moment');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 路由
app.use('/api/user', require('./routes/user'));
app.use('/api/team', require('./routes/team'));

// 每日凌晨0点自动结算
schedule.scheduleJob('0 0 * * *', async () => {
  console.log('==== 开始每日自动结算 ====', moment().format('YYYY-MM-DD'));

  const [teams] = await db.query('SELECT * FROM team WHERE status = 1');
  for (const team of teams) {
    const teamId = team.id;
    const deposit = parseFloat(team.deposit);

    const [members] = await db.query(
      'SELECT * FROM team_member WHERE team_id = $1 AND deposit_pay = 1',
      [teamId]
    );

    let totalPenalty = 0;
    const goodUsers = [];

    for (const m of members) {
      if (m.today_status === 2) {
        totalPenalty += deposit;
      } else {
        goodUsers.push(m);
      }
    }

    const perReward = goodUsers.length > 0 ? totalPenalty / goodUsers.length : 0;

    // 给守约用户发钱
    for (const u of goodUsers) {
      const add = deposit + perReward;
      await db.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [add, u.user_id]
      );
    }

    // 写入结算记录
    await db.query(
      `INSERT INTO settle_log 
      (team_id, settle_date, total_penalty, normal_user_num, per_reward) 
      VALUES ($1, CURRENT_DATE, $2, $3, $4)`,
      [teamId, totalPenalty, goodUsers.length, perReward]
    );

    // 重置次日数据
    await db.query(
      'UPDATE team_member SET today_use_min=0, today_status=0, settle_status=1 WHERE team_id=$1',
      [teamId]
    );
  }

  console.log('==== 今日结算完成 ====');
});

app.listen(port, () => {
  console.log(`后端运行在端口 ${port}`);
});
