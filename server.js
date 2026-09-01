const express = require('express');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { renderReportPdf } = require('./render');

const app = express();
app.use(express.json());

const db = new DatabaseSync('report.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// POST /reports — generate a new report
app.post('/reports', async (req, res) => {
  try {
    const createdAt = new Date().toISOString();
    const insertStub = db.prepare('INSERT INTO reports (path, created_at) VALUES (?, ?)');
    const info = insertStub.run('', createdAt); // placeholder row to get an id
    const id = info.lastInsertRowid;

    const filePath = path.join(__dirname, 'reports', `${id}.pdf`);
    await renderReportPdf(filePath);

    db.prepare('UPDATE reports SET path = ? WHERE id = ?').run(filePath, id);

    res.status(201).json({
      id,
      file: `/reports/${id}/file`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reports/:id — metadata
app.get('/reports/:id', (req, res) => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);

  if (!row) {
    return res.status(404).json({ error: 'Report not found' });
  }

  res.status(200).json({
    id: row.id,
    created_at: row.created_at,
    file: `/reports/${row.id}/file`
  });
});

// GET /reports/:id/file — serve the actual PDF
app.get('/reports/:id/file', (req, res) => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);

  if (!row) {
    return res.status(404).json({ error: 'Report not found' });
  }

  res.sendFile(row.path);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});