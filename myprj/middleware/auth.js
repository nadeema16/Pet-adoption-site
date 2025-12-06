const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login?error=Please log in to access this page');
}
function requireShelter(req, res, next) {
  if (req.session && req.session.userId && req.session.userType === 'shelter') {
    return next();
  }
  res.status(403).send('Access denied. Shelter account required.');
}
function requireAdopter(req, res, next) {
  if (req.session && req.session.userId && req.session.userType === 'adopter') {
    return next();
  }
  res.status(403).send('Access denied. Adopter account required.');
}
function getUserInfo(userId, callback) {
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    db.close();
    callback(err, user);
  });
}
module.exports = {
  requireAuth,
  requireShelter,
  requireAdopter,
  getUserInfo
};