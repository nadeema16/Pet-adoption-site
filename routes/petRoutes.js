const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const marked = require('marked');
const { requireAuth, requireShelter } = require('../middleware/auth');
const router = express.Router();
const dbPath = path.join(__dirname, '..', 'database', 'database.sqlite');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pet-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload=multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
router.get('/', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.all(
    `SELECT p.*, u.username as shelter_username 
     FROM pets p 
     JOIN users u ON p.shelter_id = u.id 
     WHERE p.status = 'active' 
     ORDER BY p.created_at DESC`,
    [],
    (err, pets) => {
      if (err) {
        db.close();
        return res.status(500).send('Error fetching pets');
      }
      pets.forEach(pet => {
        pet.formatted_date = formatDate(pet.created_at);
      });
      db.close();
      res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    }
  );
});
router.get('/pet/:id', (req, res)=>{
  const petId = parseInt(req.params.id);
  const db = new sqlite3.Database(dbPath);
  db.get(
    `SELECT p.*, u.username as shelter_username, u.email as shelter_email, u.phone as shelter_phone
     FROM pets p 
     JOIN users u ON p.shelter_id = u.id 
     WHERE p.id = ?`,
    [petId],
    (err,pet) => {
      if(err) {
        db.close();
        return res.status(500).send('Error fetching pet');
      }
      if (!pet) {
        db.close();
        return res.status(404).send('Pet not found');
      }
      pet.formatted_date=formatDate(pet.created_at);
      pet.description_html= marked.parse(pet.description);
      pet.temperament_list = pet.temperament.split(',').map(t => t.trim());
      db.close();
      res.sendFile(path.join(__dirname, '..', 'public', 'pet-details.html'));
    }
  );
});
router.get('/api/pets', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.all(
    `SELECT p.*, u.username as shelter_username 
     FROM pets p 
     JOIN users u ON p.shelter_id = u.id 
     WHERE p.status = 'active' 
     ORDER BY p.created_at DESC`,
    [],
    (err,pets) => {
      if (err){
        db.close();
        return res.status(500).json({ error: 'Error fetching pets' });
      }
      pets.forEach(pet => {
        pet.formatted_date = formatDate(pet.created_at);
      });
      db.close();
      res.json(pets);
    }
  );
});
router.get('/api/pet/:id', (req, res) => {
  const petId = parseInt(req.params.id);
  const userId = req.session ? req.session.userId : null;
  const userType = req.session ? req.session.userType : null;
  const db = new sqlite3.Database(dbPath);
  db.get(
    `SELECT p.*, u.username as shelter_username, u.email as shelter_email, u.phone as shelter_phone
     FROM pets p 
     JOIN users u ON p.shelter_id = u.id 
     WHERE p.id = ?`,
    [petId],
    async (err, pet) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Error fetching pet' });
      }
      if (!pet) {
        db.close();
        return res.status(404).json({ error: 'Pet not found' });
      }      
      pet.formatted_date = formatDate(pet.created_at);
      pet.description_html = marked.parse(pet.description);
      pet.temperament_list = pet.temperament.split(',').map(t => t.trim());
      let showContact=!userId; 
      
      if(userId && userType === 'adopter') {
        db.get(
          `SELECT id FROM applications 
           WHERE pet_id = ? AND adopter_id = ? AND status = 'approved'`,
          [petId, userId],
          (err, app) => {
            db.close();
            pet.show_contact = !err && app;
            pet.is_owner = false;
            pet.can_apply = pet.status === 'active';
            res.json(pet);
          }
        );
        return;
      }
      if (userId&&userType === 'shelter') {
        pet.show_contact= userId === pet.shelter_id;
        pet.is_owner= userId === pet.shelter_id;
        pet.can_apply= false;
        db.close();
        return res.json(pet);
      }
      pet.show_contact= showContact;
      pet.is_owner= false;
      pet.can_apply= false;
      db.close();
      res.json(pet);
    }
  );
});
router.get('/shelter/dashboard', requireAuth, requireShelter, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'shelter-dashboard.html'));
});
router.get('/api/shelter/dashboard', requireAuth, requireShelter, (req, res) => {
  const shelterId = req.session.userId;
  const db=new sqlite3.Database(dbPath);
  db.all(
    `SELECT 
      COUNT(*) as total_pets,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_pets,
      SUM(CASE WHEN status = 'adopted' THEN 1 ELSE 0 END) as adopted_pets
     FROM pets WHERE shelter_id = ?`,
    [shelterId],
    (err,stats) => {
      if(err) {
        db.close();
        return res.status(500).json({ error: 'Error fetching statistics' });
      }
      const statistics = stats[0];
      db.get(
        `SELECT COUNT(*) as pending_count
         FROM applications a
         JOIN pets p ON a.pet_id = p.id
         WHERE p.shelter_id = ? AND a.status IN ('submitted', 'under_review')`,
        [shelterId],
        (err,pending) => {
          if(err) {
            db.close();
            return res.status(500).json({ error: 'Error fetching applications' });
          }
          statistics.pending_applications= pending.pending_count;
          db.all(
            `SELECT a.*, p.name as pet_name, p.photo_url, u.username as adopter_username, u.email as adopter_email
             FROM applications a
             JOIN pets p ON a.pet_id = p.id
             JOIN users u ON a.adopter_id = u.id
             WHERE p.shelter_id = ?
             ORDER BY a.created_at DESC
             LIMIT 5`,
            [shelterId],
            (err,recentApps) => {
              db.close();
              if (err){
                return res.status(500).json({ error: 'Error fetching recent applications' });
              }
              recentApps.forEach(app => {
                app.formatted_date =formatDate(app.created_at);
              });
              res.json({
                statistics,
                recent_applications: recentApps,
                username: req.session.username
              });
            }
          );
        }
      );
    }
  );
});
router.get('/shelter/pets/new', requireAuth, requireShelter, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'list-pet.html'));
});
router.post('/api/pets', requireAuth, requireShelter, upload.single('photo'), (req, res) => {
  const { name, species_breed, age, size, temperament, description } = req.body;
  const shelterId = req.session.userId;  
  if (!name || !species_breed || !age || !size || !temperament || !description) {
    return res.status(400).json({ error: 'All fields are required' });
  }  
  if (!['small', 'medium', 'large'].includes(size)) {
    return res.status(400).json({ error: 'Invalid size' });
  }
  let photoUrl = 'https://placedog.net/400/400'; 
  if (req.file) {
    photoUrl = '/uploads/' + req.file.filename;
  }
  const db = new sqlite3.Database(dbPath);  
  db.run(
    `INSERT INTO pets (shelter_id, name, species_breed, photo_url, age, size, temperament, description, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [shelterId, name, species_breed, photoUrl, age, size, temperament, description],
    function(err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Error creating pet listing' });
      }   
      db.close();
      res.json({ success: true, petId: this.lastID, redirect: '/shelter/pets' });
    }
  );
});
router.get('/shelter/pets', requireAuth, requireShelter, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'my-pets.html'));
});
router.get('/api/shelter/pets', requireAuth, requireShelter, (req, res) => {
  const shelterId = req.session.userId;
  const db = new sqlite3.Database(dbPath);
  db.all(
    `SELECT p.*, 
     (SELECT COUNT(*) FROM applications WHERE pet_id = p.id AND status IN ('submitted', 'under_review')) as pending_count
     FROM pets p
     WHERE p.shelter_id = ?
     ORDER BY p.created_at DESC`,
    [shelterId],
    (err, pets) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Error fetching pets' });
      }
      pets.forEach(pet => {
        pet.formatted_date = formatDate(pet.created_at);
        pet.temperament_list = pet.temperament.split(',').map(t => t.trim());
      }); 
      res.json(pets);
    }
  );
});
router.put('/api/pet/:id/status', requireAuth, requireShelter, (req, res) => {
  const petId = parseInt(req.params.id);
  const { status } = req.body;
  const shelterId = req.session.userId;
  if (!['active', 'adopted'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT shelter_id FROM pets WHERE id = ?', [petId], (err, pet) => {
    if (err || !pet) {
      db.close();
      return res.status(404).json({ error: 'Pet not found' });
    }
    if (pet.shelter_id !== shelterId) {
      db.close();
      return res.status(403).json({ error: 'Not authorized' });
    }
    db.run(
      'UPDATE pets SET status = ? WHERE id = ?',
      [status, petId],
      async function(err) {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Error updating status' });
        }
      }
    );
  });
});
function formatDate(dateString) {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
module.exports = router;