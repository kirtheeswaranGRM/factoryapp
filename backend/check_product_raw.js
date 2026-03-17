const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres', host: 'localhost', database: 'postgres', password: 'Post@123', port: 5432,
});
pool.query("SELECT * FROM inventory_product LIMIT 1", (err, res) => {
    if (err) console.error(err);
    else console.log(JSON.stringify(res.rows[0]));
    pool.end();
});
