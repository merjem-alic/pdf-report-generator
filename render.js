const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { getReportData } = require('./report');

function getAllBooks() {
  const db = new DatabaseSync('report.db');
  const rows = db.prepare('SELECT title, price, rating FROM books ORDER BY id').all();
  db.close();
  return rows;
}

function buildHtml(data, allBooks) {
  const today = new Date().toISOString().split('T')[0];

  const top5Rows = data.top_5_most_expensive
    .map(b => `<tr><td>${b.title}</td><td>£${b.price.toFixed(2)}</td></tr>`)
    .join('');

  const ratingRows = data.books_per_rating
    .map(r => `<tr><td>${r.rating}</td><td>${r.count}</td></tr>`)
    .join('');

  const allBooksRows = allBooks
    .map(b => `<tr><td>${b.title}</td><td>£${b.price.toFixed(2)}</td><td>${b.rating}</td></tr>`)
    .join('');

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { font-size: 24px; }
          h2 { font-size: 16px; margin-top: 30px; }
          .totals { display: flex; gap: 40px; margin: 20px 0; }
          .stat { font-size: 14px; }
          .stat strong { font-size: 20px; display: block; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 12px; }
          thead { display: table-header-group; }
          tr { break-inside: avoid; }
        </style>
      </head>
      <body>
        <h1>Book Catalogue Report — ${today}</h1>
        <div class="totals">
          <div class="stat"><strong>${data.total_books}</strong>Total Books</div>
          <div class="stat"><strong>£${data.average_price}</strong>Average Price</div>
        </div>

        <h2>Top 5 Most Expensive Books</h2>
        <table>
          <thead><tr><th>Title</th><th>Price</th></tr></thead>
          <tbody>${top5Rows}</tbody>
        </table>

        <h2>Books Per Rating</h2>
        <table>
          <thead><tr><th>Rating</th><th>Count</th></tr></thead>
          <tbody>${ratingRows}</tbody>
        </table>

        <h2>All Books (${allBooks.length})</h2>
        <table>
          <thead><tr><th>Title</th><th>Price</th><th>Rating</th></tr></thead>
          <tbody>${allBooksRows}</tbody>
        </table>
      </body>
    </html>
  `;
}

async function renderReportPdf(outputPath) {
  const data = getReportData();
  const allBooks = getAllBooks();
  const html = buildHtml(data, allBooks);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  await page.pdf({ path: outputPath, format: 'A4', printBackground: true });
  await browser.close();

  return outputPath;
}

module.exports = { renderReportPdf, buildHtml };

// allow running directly for testing
if (require.main === module) {
  const outDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  renderReportPdf(path.join(outDir, 'test.pdf')).then(p => {
    console.log(`PDF written to ${p}`);
  });
}