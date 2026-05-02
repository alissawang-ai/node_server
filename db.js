const { Pool } = require('pg');

const pool = new Pool({
  host: 'dpg-d7qotqnlk1mc73cmi0ig-a',
  port: 5432,
  database: 'phone_db_vec9',
  user: 'phone_db_vec9_user',
  password: 'pe9aMFzfhBgCd8GBbKesiiiTnT0ztYSr',
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
