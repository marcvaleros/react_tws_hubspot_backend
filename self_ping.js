const https = require('https');

// Ping your own Heroku app to keep the dyno alive
const keepDynoAlive = () => {
  const url = 'https://tws-automation-7d578fa3534b.herokuapp.com';  // Replace with your Heroku app's URL

  https.get(url, (res) => {
    console.log('Self-ping successful, statusCode:', res.statusCode);
  }).on('error', (e) => {
    console.error('Self-ping error:', e.message);
  });
};


module.exports = {
  keepDynoAlive
}