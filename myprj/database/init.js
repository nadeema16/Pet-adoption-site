const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);
const uploadsDir=path.join(__dirname, '..', 'public','uploads');
if (!fs.exictsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, {recursive: true});
}
async function