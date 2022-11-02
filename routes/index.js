var express = require('express');
var router = express.Router();
const { Pool } = require('pg')
const { createHash } = require('crypto');

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

async function getUser(user){
  var result = await pool.query("SELECT * FROM users WHERE username LIKE $1", [user]);
  return result.rows
}

var zahtjevi = []


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

router.post('/login', async function(req, res, next) {
  var user = req.body.username
  var password = req.body.password

  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress

  var chk = req.body.on2 == "on2"

  var userDB = await getUser(user)
  var poruka = ""

  
  if(!chk){
    var zahtjev = zahtjevi.find(a=>a.ip==ip)
    var date = new Date()
    if (zahtjev){
      var vrijeme = zahtjev.vrijeme
      zahtjevi.find(a=>a.ip==ip).vrijeme = Math.round(date.getTime()/1000)
      if(vrijeme > Math.round(date.getTime()/1000) - 3){
        poruka = "Previše puta ste se probali prijaviti u kratkom roku"
        res.render('index', { klubovi: {}, poruka: poruka, onba: chk, username: user});
        return;
      }
      
    } else{
      zahtjevi.push({ip: ip, vrijeme: Math.round(date.getTime()/1000)});
    }
  }

  if (userDB.length > 0){
    if(hash(password).localeCompare(userDB[0].passwordhash)==0){
      poruka = "Dobrodošli, " + user
      user = undefined
    } else{
      if(chk){
        poruka = "Pogrešna šifra za tog korisnika."
      } else{
        poruka = "Netočni podaci za prijavu!"
      }
    }
  } else{
    if (chk){
      poruka = "Nepostojeći user!"
    } else{
      poruka = "Netočni podaci za prijavu!"
    }
  }

  res.render('index', { klubovi: {}, poruka: poruka, onba: chk, username: user});
});

function hash(string) {
  return createHash('sha256').update(string).digest('hex');
}

module.exports = router;