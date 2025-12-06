const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
async function initDatabase() {
  console.log('Initializing database...');
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK(user_type IN ('shelter', 'adopter')),
    email TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('✓ Users table created');
  });

  db.run(`CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shelter_id INTEGER NOT NULL,
    species_breed TEXT NOT NULL,
    photo_url TEXT,
    age TEXT NOT NULL,
    size TEXT NOT NULL CHECK(size IN ('small', 'medium', 'large')),
    temperament TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'adopted')),
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shelter_id) REFERENCES users(id)
  )`, (err) => {
    if (err) console.error('Error creating pets table:', err);
    else console.log('✓ Pets table created');
  });
  db.run(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL,
    adopter_id INTEGER NOT NULL,
    home_setup TEXT NOT NULL,
    prior_pets TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'under_review', 'approved', 'declined')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pet_id) REFERENCES pets(id),
    FOREIGN KEY (adopter_id) REFERENCES users(id)
  )`, (err) => {
    if (err) console.error('Error creating applications table:', err);
    else console.log('✓ Applications table created');
  });
  db.run(`CREATE TABLE IF NOT EXISTS mock_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating mock_emails table:', err);
    else console.log('✓ Mock_Emails table created');
  });
  setTimeout(async () => {
    await seedData();
    db.close();
  }, 500);
}
async function seedData() {
  console.log('\nSeeding data...');
  const hashedPassword = await bcrypt.hash('p455w0rd', 10);
  const shelters = [
    { username: 'shelter1', email: 'shelter1@example.com', phone: '(555) 001-0001' },
    { username: 'shelter2', email: 'shelter2@example.com', phone: '(555) 002-0002' }
  ];
  const shelterIds = [];
  for (const shelter of shelters) {
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO users (username, password, user_type, email, phone) 
         VALUES (?, ?, ?, ?, ?)`,
        [shelter.username, hashedPassword, 'shelter', shelter.email, shelter.phone],
        function(err) {
          if (err) {
            console.error(`Error inserting ${shelter.username}:`, err);
            reject(err);
          } else {
            if (this.lastID) {
              shelterIds.push(this.lastID);
              console.log(`✓ Created shelter: ${shelter.username}`);
            } else {
              db.get('SELECT id FROM users WHERE username = ?', [shelter.username], (err, row) => {
                if (!err && row) shelterIds.push(row.id);
                resolve();
              });
            }
            resolve();
          }
        }
      );
    });
  }
  await new Promise(resolve => setTimeout(resolve, 200));
  const actualShelterIds = [];
  for (const shelter of shelters) {
    await new Promise(resolve => {
      db.get('SELECT id FROM users WHERE username = ?', [shelter.username], (err, row) => {
        if (!err && row) actualShelterIds.push(row.id);
        resolve();
      });
    });
  }
  const petsData = [
    {
      name: 'Max', species_breed: 'Labrador Retriever', age: 'young (1-3 years)', 
      size: 'large', temperament: 'friendly, playful, energetic',
      photo_url: 'https://placedog.net/400/400?id=1',
      description: `## About Max

Max is a **wonderful young Labrador Retriever** looking for his forever home! At 2 years old, he's full of energy and ready to bring joy to your family.

### Health Status
Max is in excellent health! He's been fully vaccinated and is up-to-date on all his shots. He's been neutered and microchipped. His most recent vet checkup showed no issues - he's ready to go home!

### Personality Traits
Max is the definition of a friendly, outgoing dog. He loves meeting new people and gets along great with children and other pets. His playful nature means he'd be perfect for an active family who enjoys outdoor activities. He's always ready for a game of fetch or a long walk in the park.

### Adoption Requirements
Max would do best in a home with a yard where he can run and play. An active family that can provide daily exercise would be ideal. He's already house-trained and knows basic commands. Adoption fee covers all his medical care.`
    },
    {
      name: 'Luna', species_breed: 'Siamese Cat', age: 'adult (4-7 years)', 
      size: 'small', temperament: 'affectionate, calm, independent',
      photo_url: 'https://placekitten.com/400/400?id=1',
      description: `## About Luna

Luna is a **beautiful Siamese cat** who's ready to find her perfect human companion. At 5 years old, she's past the kitten phase and is looking for a calm, loving home.

### Health Status
Luna is healthy and has received all necessary vaccinations. She's been spayed and microchipped. Her vet records show she's in excellent condition with no ongoing health issues.

### Personality Traits
Luna is known for being affectionate and calm. She enjoys quiet evenings curled up on the couch and will happily purr while you pet her. While she's independent enough to entertain herself, she also loves human companionship and will seek you out for attention. She's perfect for someone looking for a low-maintenance but loving pet.

### Adoption Requirements
Luna would do well in a quiet home environment. She's litter-trained and doesn't require a lot of space - she'd be happy in an apartment. She prefers a calm household without too much commotion. Adoption fee includes all her medical records and care.`
    },
    {
      name: 'Charlie', species_breed: 'German Shepherd', age: 'adult (4-7 years)', 
      size: 'large', temperament: 'protective, intelligent, gentle',
      photo_url: 'https://placedog.net/400/400?id=2',
      description: `## About Charlie

Charlie is an **impressive German Shepherd** with a heart of gold. At 6 years old, he's mature, well-trained, and ready to be your loyal companion.

### Health Status
Charlie is in great health! All vaccinations are current, and he's been neutered and microchipped. He's had regular vet checkups and is in excellent physical condition for his age.

### Personality Traits
Charlie is protective of his family but gentle with those he knows. He's incredibly intelligent and responds well to commands. He has a calm demeanor but will spring into action when needed. He forms strong bonds with his owners and is known for his loyalty. He's great with children and can be protective without being aggressive.

### Adoption Requirements
Charlie needs an experienced owner who understands large dog breeds. A home with space for him to move around is preferred. He would benefit from regular exercise and mental stimulation. He's already house-trained and knows advanced commands. Adoption includes all his training records.`
    },
    {
      name: 'Bella', species_breed: 'Persian Cat', age: 'senior (8+ years)', 
      size: 'small', temperament: 'calm, gentle, affectionate',
      photo_url: 'https://placekitten.com/400/400?id=2',
      description: `## About Bella

Bella is a **sweet senior Persian cat** looking for a peaceful retirement home. At 9 years old, she's calm, gentle, and full of love to give.

### Health Status
Bella is healthy for her age! She receives regular veterinary care and all her vaccinations are up-to-date. She's been spayed and microchipped. While she's a senior cat, she's in good health with no major issues. She does require regular grooming due to her long coat.

### Personality Traits
Bella is the epitome of a gentle, calm cat. She loves to lounge in sunny spots and enjoys quiet companionship. She's not very active but makes up for it with her affectionate nature. She'll happily curl up next to you and purr contentedly. She's perfect for someone looking for a low-energy, loving companion.

### Adoption Requirements
Bella would thrive in a quiet, calm home environment. She doesn't need much space - an apartment would be fine. Her long coat requires regular grooming, so an owner willing to brush her regularly would be ideal. She's litter-trained and very easy-going. Senior cat adoption fee is reduced and includes all her medical care.`
    },
    {
      name: 'Rocky', species_breed: 'Golden Retriever', age: 'puppy/kitten', 
      size: 'medium', temperament: 'playful, friendly, energetic',
      photo_url: 'https://placedog.net/400/400?id=3',
      description: `## About Rocky

Rocky is an **adorable Golden Retriever puppy** ready to bring endless joy to your home! At just 4 months old, he's full of energy and ready to grow up with your family.

### Health Status
Rocky is healthy and growing well! He's received his first round of puppy vaccinations and is scheduled for more. He's been microchipped and will be ready for neutering when he reaches the appropriate age. All his vet records are up-to-date.

### Personality Traits
Rocky is a typical happy, playful puppy! He loves to play fetch, chase toys, and explore everything around him. He's very friendly and social, making friends with everyone he meets. He's smart and eager to learn, making him a great candidate for training. His puppy energy is contagious - he'll keep you active and entertained!

### Adoption Requirements
Rocky needs a home ready for puppy life! This means puppy-proofing, house-training (he's learning!), and lots of patience. An active family who can provide proper training and socialization would be perfect. He'll need regular exercise and mental stimulation as he grows. Adoption includes initial vaccinations and vet care.`
    },
    {
      name: 'Daisy', species_breed: 'Tabby Cat', age: 'young (1-3 years)', 
      size: 'small', temperament: 'playful, independent, friendly',
      photo_url: 'https://placekitten.com/400/400?id=3',
      description: `## About Daisy

Daisy is a **charming young Tabby cat** full of personality! At 2 years old, she's playful yet independent, making her a delightful companion.

### Health Status
Daisy is in perfect health! She's fully vaccinated, spayed, and microchipped. Her vet checkups show she's thriving and ready for her new home. No health concerns at all.

### Personality Traits
Daisy has a wonderful mix of playfulness and independence. She loves to chase toys and play hide-and-seek, but she's also perfectly content entertaining herself. She's friendly with people and enjoys attention on her own terms. She's curious and loves to explore, making her fun to watch as she discovers new things around the house.

### Adoption Requirements
Daisy would do well in almost any home environment. She's adaptable and doesn't require a lot of space. She's litter-trained and very low-maintenance. An owner who can provide toys and some playtime would be ideal, but she's also fine being independent. Adoption fee includes all medical care.`
    },
    {
      name: 'Cooper', species_breed: 'Beagle', age: 'adult (4-7 years)', 
      size: 'medium', temperament: 'friendly, energetic, gentle',
      photo_url: 'https://placedog.net/400/400?id=4',
      description: `## About Cooper

Cooper is a **lovable Beagle** with an infectious personality! At 5 years old, he's the perfect balance of energy and calmness.

### Health Status
Cooper is healthy and happy! All vaccinations are current, and he's been neutered and microchipped. Regular vet visits confirm he's in excellent health with no ongoing issues.

### Personality Traits
Cooper is friendly with everyone he meets - dogs, cats, and people of all ages. He has a gentle nature that makes him great with children. He's energetic enough to enjoy long walks and playtime, but also knows how to relax. His beagle nose keeps him curious, so he loves exploring new scents and environments.

### Adoption Requirements
Cooper would do best in a home where he can get regular exercise. Daily walks are important for his health and happiness. He's house-trained and knows basic commands. He gets along great with other pets, so multi-pet households are welcome! Adoption includes all his medical records.`
    },
    {
      name: 'Lucy', species_breed: 'Maine Coon', age: 'adult (4-7 years)', 
      size: 'medium', temperament: 'gentle, affectionate, calm',
      photo_url: 'https://placekitten.com/400/400?id=4',
      description: `## About Lucy

Lucy is a **magnificent Maine Coon** with a gentle soul. At 6 years old, she's mature, calm, and ready to be your loving companion.

### Health Status
Lucy is in excellent health! She's fully vaccinated, spayed, and microchipped. Her long, beautiful coat is well-maintained, and she has no health issues. Regular vet care keeps her in top condition.

### Personality Traits
Lucy embodies the gentle, calm nature that Maine Coons are known for. She's affectionate and loves to be near her humans, often following you around the house just to be in your presence. She's not overly demanding but will let you know when she wants attention. Her calm demeanor makes her perfect for families or individuals looking for a peaceful companion.

### Adoption Requirements
Lucy would thrive in a home where she can be part of the family. While she doesn't need tons of space, she appreciates having room to move around. Her long coat requires regular grooming to keep it beautiful and tangle-free. She's litter-trained and very low-maintenance otherwise. Adoption includes grooming supplies and medical records.`
    },
    {
      name: 'Milo', species_breed: 'Bulldog', age: 'young (1-3 years)', 
      size: 'medium', temperament: 'calm, friendly, gentle',
      photo_url: 'https://placedog.net/400/400?id=5',
      description: `## About Milo

Milo is a **charming Bulldog** with a laid-back personality! At 2 years old, he's friendly, calm, and ready to be your best buddy.

### Health Status
Milo is healthy and doing great! He's fully vaccinated, neutered, and microchipped. Bulldogs require some special care, and Milo receives regular checkups to ensure he stays healthy. His vet confirms he's in good shape!

### Personality Traits
Milo has that classic bulldog calmness mixed with a friendly, gentle nature. He's not hyperactive but enjoys moderate exercise and playtime. He's great with people of all ages and gets along well with other dogs. His laid-back attitude makes him perfect for apartment living or homes without large yards.

### Adoption Requirements
Milo would do well in various living situations - apartments, houses, with or without yards. He doesn't require excessive exercise but does need regular walks. His facial structure means he needs a climate-controlled environment and shouldn't be overexerted in heat. He's house-trained and knows basic commands. Adoption includes all his care information.`
    },
    {
      name: 'Sadie', species_breed: 'Calico Cat', age: 'adult (4-7 years)', 
      size: 'small', temperament: 'independent, affectionate, playful',
      photo_url: 'https://placekitten.com/400/400?id=5',
      description: `## About Sadie

Sadie is a **stunning Calico cat** with a big personality! At 5 years old, she's independent yet affectionate, making her a wonderful companion.

### Health Status
Sadie is in perfect health! She's fully vaccinated, spayed, and microchipped. Her vet records show she's thriving with no health concerns. Her beautiful calico coat is healthy and well-maintained.

### Personality Traits
Sadie has a great balance of independence and affection. She loves to explore and play on her own, but she also seeks out attention and cuddles when she wants them. She's known for her playful antics - you'll often find her chasing toys or batting at things around the house. She's friendly with people once she gets to know them.

### Adoption Requirements
Sadie would do well in almost any home setting. She's adaptable and doesn't require special accommodations. She's litter-trained and very easy to care for. An owner who can appreciate her independent nature while also providing affection when she wants it would be perfect. Adoption fee includes all medical care and records.`
    }
  ];
  for (let i = 0; i < petsData.length; i++) {
    const pet = petsData[i];
    const shelterId = actualShelterIds[Math.floor(i / 5)]; 

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO pets (shelter_id, name, species_breed, photo_url, age, size, temperament, description, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [shelterId, pet.name, pet.species_breed, pet.photo_url, pet.age, pet.size, pet.temperament, pet.description],
        function(err) {
          if (err) {
            console.error(`Error inserting pet ${pet.name}:`, err);
            reject(err);
          } else {
            if (this.changes > 0) {
              console.log(`✓ Created pet: ${pet.name} for shelter ${shelterId}`);
            }
            resolve();
          }
        }
      );
    });
  }
  console.log('\n✓ Database initialization complete!');
}
initDatabase();