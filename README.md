# PDF Report Generator
Query a small SQLite database with SQL aggregatoin, render the results into a real PDF report, and serve it form an Express API by link. 

## Datatset
Reused the 60 valudared book records collected in the polite scraper assignment (books.json), rather than just generating fake seed data; real data is already collected and validated.

## How to run
```
git clone https://github.com/merjem-alic/pdf-report-generator.git
cd pdf-report-generator
npm install
npx playwright install chromium
node seed.js       # seeds report.db from data/books.json
npm start          # starts the API on http://localhost:3000
```

Then in another terminal:
```
curl -i -X POST http://localhost:3000/reports
curl -o my-report.pdf http://localhost:3000/reports/1/file
```

## Aggregation SQL
```
-- Total books
SELECT COUNT(*) AS count FROM books;

-- Average price
SELECT AVG(price) AS avg FROM books;

-- Top 5 most expensive
SELECT title, price FROM books ORDER BY price DESC LIMIT 5;

-- Books per star rating
SELECT rating, COUNT(*) AS count FROM books GROUP BY rating ORDER BY rating;
```

## POST -> download proof
```
PS> Measure-Command { Invoke-RestMethod -Uri http://localhost:3000/reports -Method Post }
TotalMilliseconds : 954.0007

PS> Invoke-WebRequest -Uri http://localhost:3000/reports/1/file -OutFile my-report.pdf
```

Real, visible pause (~1s) before the response, then a 3-page PDF downloaded and opened successfully. 

## Stage 4 note - when would this move out of the request
Once report generation regularly takes several seconds under real load (like larger datasets or many concurrent users, for instance), or the API needs to stay responsive while multiple reports generate at once, this would mvoe to a background job. `POST/reposts` would return 202 immediately with a status the client can poll, instead of holding the connection open for the whole render. 

## Stage 5 notes - idempotency
**What the once-per-day check protects against**: a user (or a flaky client, or a double-click) firing the same generate report request twice in quick succession, which would otherwise silently produce two separate PDF files and two database rows for what should be one report.

**Real-world example: an e-commerce order confirmation** - if place order isn't idempotent, a user double-clicking confirm due to a slow page could get charged twice and receive two separate shipments for what they intended as one order.

## Proof of work
See `reports/` folder for all PDF documents generated along the way. 