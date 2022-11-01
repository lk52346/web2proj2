var express = require('express');
var router = express.Router();
const { Pool } = require('pg')

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'rezultatiligedb',
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl : true
})

pool.connect()

async function getKlubBad(ime){
    var result = await pool.query(`SELECT * FROM klub WHERE ime = '` + ime + `'`);
    return result.rows
}

async function getKlubGood(ime){
  var result = await pool.query("SELECT * FROM klub WHERE ime LIKE $1", [ime]);
  return result.rows
}


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { klubovi: {}});
});

router.get('/sql', async function(req, res) {
  var klubovi;
  var chk = req.query.on == "on"
  if(chk){
    klubovi = await getKlubBad(req.query.filter);
  } else{
    klubovi = await getKlubGood(req.query.filter);
  }
  res.render('index', { klubovi: klubovi, onsql: chk, filter: req.query.filter });
});

module.exports = router;