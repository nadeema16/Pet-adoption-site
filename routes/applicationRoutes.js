const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { requireAuth, requireAdopter, requireShelter } = require('../middleware/auth');
const router = express.Router();
const dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');
router.get('/apply/:petId', requireAuth, requireAdopter, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'apply.html'));
});
router.get('/api/apply/:petId', requireAuth, requireAdopter, (req, res) => {
  const petId = parseInt(req.params.petId);
  const adopterId = req.session.userId;
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT id, name FROM pets WHERE id = ? AND status = ?', [petId, 'active'], (err, pet) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Error fetching pet' });
    }
    if (!pet) {
      db.close();
      return res.status(404).json({ error: 'Pet not found or not available' });
    }
    db.get('SELECT id FROM applications WHERE pet_id = ? AND adopter_id = ?', [petId, adopterId], (err, existingApp) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Error checking applications' });
      }
      if (existingApp) {
        return res.status(400).json({ error: 'You have already applied for this pet' });
      }
      res.json({
        pet: pet,
        user: {
          name: req.session.username,
          email: req.session.email
        }
      });
    });
  });
});
router.post('/api/apply/:petId', requireAuth, requireAdopter, (req, res) => {
  const petId = parseInt(req.params.petId);
  const adopterId = req.session.userId;
  const { phone, home_setup, prior_pets } = req.body;
  if (!home_setup || !prior_pets) {
    return res.status(400).json({ error: 'Home setup and prior pets fields are required' });
  }
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT id, name FROM pets WHERE id = ? AND status = ?', [petId, 'active'], (err, pet) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Error fetching pet' });
    }
    if (!pet) {
      db.close();
      return res.status(404).json({ error: 'Pet not found or not available for adoption' });
    }
    db.get('SELECT id FROM applications WHERE pet_id = ? AND adopter_id = ?', [petId, adopterId], (err, existingApp) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Error checking applications' });
      }
      if (existingApp) {
        db.close();
        return res.status(400).json({ error: 'You have already applied for this pet' });
      }
      db.run(
        `INSERT INTO applications (pet_id, adopter_id, home_setup, prior_pets, status)
         VALUES (?, ?, ?, ?, 'submitted')`,
        [petId, adopterId, home_setup, prior_pets],
        function(err) {
          if (err) {
            db.close();
            return res.status(500).json({ error: 'Error submitting application' });
          }
          db.close();
          res.json({ success: true, redirect: '/adopter/dashboard' });
        }
      );
    });
  });
});
router.get('/adopter/dashboard', requireAuth, requireAdopter, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'adopter-dashboard.html'));
});
router.get('/api/adopter/applications', requireAuth, requireAdopter, (req, res) => {
  const adopterId = req.session.userId;
  const db = new sqlite3.Database(dbPath);
  db.all(
    `SELECT a.*, p.name as pet_name, p.photo_url, p.id as pet_id,
     u.username as shelter_username, u.email as shelter_email, u.phone as shelter_phone
     FROM applications a
     JOIN pets p ON a.pet_id = p.id
     JOIN users u ON p.shelter_id = u.id
     WHERE a.adopter_id = ?
     ORDER BY a.created_at DESC`,
    [adopterId],
    (err, applications) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Error fetching applications' });
      }
      applications.forEach(app => {
        app.formatted_date = formatDate(app.created_at);
        app.show_contact = app.status === 'approved';
      });      
      res.json(applications);
    }
  );
});
router.get('/api/application/:id', requireAuth, requireAdopter, (req, res) => {
  const applicationId = parseInt(req.params.id);
  const adopterId = req.session.userId;
  const db = new sqlite3.Database(dbPath);
  db.get(
    `SELECT a.*, p.name as pet_name, p.photo_url, p.id as pet_id,
     u.username as shelter_username, u.email as shelter_email, u.phone as shelter_phone
     FROM applications a
     JOIN pets p ON a.pet_id = p.id
     JOIN users u ON p.shelter_id = u.id
     WHERE a.id = ? AND a.adopter_id = ?`,
    [applicationId, adopterId],
    (err, application) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Error fetching application' });
      }
      if (!application) {
        return res.status(404).json({ error: 'Application not found' });
      }
      application.formatted_date = formatDate(application.created_at);
      application.updated_date = formatDate(application.updated_at);
      application.show_contact = application.status === 'approved';
      res.json(application);
    }
  );
});
router.get('/shelter/applications/:petId', requireAuth, requireShelter, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'shelter-applications.html'));
});
router.get('/api/shelter/applications/:petId', requireAuth, requireShelter, (req, res) => {
  const petId = parseInt(req.params.petId);
  const shelterId = req.session.userId;
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT * FROM pets WHERE id = ? AND shelter_id = ?', [petId, shelterId], (err, pet) => {
    if (err) {
      db.close();
      return res.status(500).json({ error: 'Error fetching pet' });
    }    
    if (!pet) {
      db.close();
      return res.status(404).json({ error: 'Pet not found' });
    }
    db.all(
      `SELECT a.*, u.username as adopter_username, u.email as adopter_email
       FROM applications a
       JOIN users u ON a.adopter_id = u.id
       WHERE a.pet_id = ?
       ORDER BY a.created_at DESC`,
      [petId],
      (err, applications) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: 'Error fetching applications' });
        }
        applications.forEach(app => {
          app.formatted_date = formatDate(app.created_at);
          app.updated_date = formatDate(app.updated_at);
        });
        pet.formatted_date = formatDate(pet.created_at);
        pet.temperament_list = pet.temperament.split(',').map(t => t.trim());
        res.json({
          pet: pet,
          applications: applications
        });
      }
    );
  });
});
router.put('/api/application/:id/status', requireAuth, requireShelter, (req, res) => {
  const applicationId = parseInt(req.params.id);
  const { status } = req.body;
  const shelterId = req.session.userId;
  if (!['submitted', 'under_review', 'approved', 'declined'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const db = new sqlite3.Database(dbPath);
  db.get(
    `SELECT a.*, p.name as pet_name, p.id as pet_id, u.email as adopter_email, u.username as adopter_username
     FROM applications a
     JOIN pets p ON a.pet_id = p.id
     JOIN users u ON a.adopter_id = u.id
     WHERE a.id = ? AND p.shelter_id = ?`,
    [applicationId, shelterId],
    (err, application) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Error fetching application' });
      }
      if (!application) {
        db.close();
        return res.status(404).json({ error: 'Application not found' });
      }
      db.run(
        `UPDATE applications 
         SET status = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [status, applicationId],
        async function(err) {
          if (err) {
            db.close();
            return res.status(500).json({ error: 'Error updating status' });
          }
          const statusMessages = {
            'under_review': 'Your application is now under review',
            'approved': 'Congratulations! Your application has been approved',
            'declined': 'Unfortunately, your application has been declined'
          };
          db.close();
          res.json({ success: true });
        }
      );
    }
  );
});
function formatDate(dateString) {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
module.exports = router;