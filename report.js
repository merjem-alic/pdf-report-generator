const { DatabaseSync } = require('node:sqlite');

function getReportData() {
  const db = new DatabaseSync('report.db');

  const totalBooks = db.prepare('SELECT COUNT(*) AS count FROM books').get();

  const avgPrice = db.prepare('SELECT AVG(price) AS avg FROM books').get();

  const topExpensive = db.prepare(
    'SELECT title, price FROM books ORDER BY price DESC LIMIT 5'
  ).all();

  const perRating = db.prepare(
    'SELECT rating, COUNT(*) AS count FROM books GROUP BY rating ORDER BY rating'
  ).all();

  db.close();

  return {
    total_books: totalBooks.count,
    average_price: Math.round(avgPrice.avg * 100) / 100,
    top_5_most_expensive: topExpensive,
    books_per_rating: perRating
  };
}

module.exports = { getReportData };