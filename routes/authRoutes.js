const express = require('express');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');
router.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    if (req.session.userType === 'shelter') {
      return res.redirect('/shelter/dashboard');
    } else {
      return res.redirect('/adopter/dashboard');
    }
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      db.close();
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        db.close();
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.userType = user.user_type;
      req.session.email = user.email;
      db.close();
      if (user.user_type === 'shelter') {
        res.json({ redirect: '/shelter/dashboard' });
      } else {
        res.json({ redirect: '/' }); 
      }
    } catch (error) {
      db.close();
      res.status(500).json({ error: 'Error during login' });
    }
  });
});
router.get('/register', (req, res) => {
  if (req.session && req.session.userId) {
    if (req.session.userType === 'shelter') {
      return res.redirect('/shelter/dashboard');
    } else {
      return res.redirect('/adopter/dashboard');
    }
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
});
router.post('/register', async (req, res) => {
  const { username, email, phone, password, confirmPassword, userType } = req.body;
  if (!username || !email || !password || !confirmPassword || !userType) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (userType === 'shelter' && !phone) {
    return res.status(400).json({ error: 'Phone number is required for shelters' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const db = new sqlite3.Database(dbPath); 
    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, existingUser) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }
      if (existingUser) {
        db.close();
        return res.status(400).json({ error: 'Username already exists' });
      }
      db.run(
        `INSERT INTO users (username, password, user_type, email, phone) 
         VALUES (?, ?, ?, ?, ?)`,
        [username, hashedPassword, userType, email, phone || null],
        function(err) {
          if (err) {
            db.close();
            return res.status(500).json({ error: 'Error creating account' });
          }
          req.session.userId = this.lastID;
          req.session.username = username;
          req.session.userType = userType;
          req.session.email = email;
          db.close();
          if (userType === 'shelter') {
            res.json({ redirect: '/shelter/dashboard' });
          } else {
            res.json({ redirect: '/' });
          }
        });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error during registration' });
  }
});
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.json({ redirect: '/' });
  });
});
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    res.redirect('/');
  });
});
router.get('/api/user/check', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      loggedIn: true,
      username: req.session.username,
      userType: req.session.userType
    });
  } else {
    res.json({ loggedIn: false });
  }
});
module.exports = router;