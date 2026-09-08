const { parse } = require("csv-parse/sync");

function parseRosterCSV(buffer) {
  let records;
  try {
    records = parse(buffer, {
      columns: (header) => header.map((h) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    return { valid: [], errors: [{ row: 0, reason: "Could not parse CSV: " + err.message }] };
  }

  const valid = [];
  const errors = [];
  const seenEmails = new Set();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  records.forEach((row, i) => {
    const rowNum = i + 2;
    const name = row.name || row["student name"] || "";
    const email = (row.email || "").toLowerCase();
    const enrollmentNo = row.enrollmentno || row["enrollment no"] || row["enrollment no."] || "";

    if (!name || !email) {
      errors.push({ row: rowNum, reason: "Missing name or email." });
      return;
    }
    if (!emailRegex.test(email)) {
      errors.push({ row: rowNum, reason: `Invalid email format: "${email}"` });
      return;
    }
    if (seenEmails.has(email)) {
      errors.push({ row: rowNum, reason: `Duplicate email in file: "${email}"` });
      return;
    }
    seenEmails.add(email);
    valid.push({ name, email, enrollmentNo });
  });

  return { valid, errors };
}

module.exports = { parseRosterCSV };
