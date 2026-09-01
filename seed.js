const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const db = new DatabaseSync('report.db');

// create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    price REAL NOT NULL,
    rating TEXT,
    url TEXT NOT NULL
  )
`);

// clear existing rows so running this twice doesn't double the data
db.exec('DELETE FROM books');

const booksPath = path.join(__dirname, 'data', 'books.json');
const books = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));

const insert = db.prepare('INSERT INTO books (title, price, rating, url) VALUES (?, ?, ?, ?)');

for (const book of books) {
  insert.run(book.title, book.price_gbp, book.rating_text, book.product_url);
}

const count = db.prepare('SELECT COUNT(*) AS count FROM books').get();
console.log(`Seeded ${count.count} books.`);

db.close();