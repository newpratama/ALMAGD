#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------
// Helpers
// ----------------------------------------------------
function excelSerialToISO(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return new Date(Date.UTC(1899, 11, 30) + val * 86400000).toISOString().slice(0, 10);
  }
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return str;
}

function toTitleCase(str) {
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function mapSource(src) {
  const s = String(src || '').trim().toLowerCase();
  if (s.includes('walk-in') || s === 'walk_in' || s === 'walkin') return 'walk_in';
  if (s.includes('tiket')) return 'tiket';
  if (s.includes('booking')) return 'booking';
  if (s.includes('agoda')) return 'agoda';
  if (s.includes('traveloka')) return 'traveloka';
  return 'other';
}

function mapMethod(m) {
  const method = String(m || '').trim().toLowerCase();
  if (method === 'cash') return 'cash';
  if (method === 'transfer') return 'transfer';
  if (method.includes('aplikasi') || method === 'app') return 'app';
  return 'other';
}

// ----------------------------------------------------
// Main
// ----------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const isCommit = args.includes('--commit');
  const filePathArg = args.find((a) => !a.startsWith('--'));
  const excelPath = filePathArg
    ? path.resolve(process.cwd(), filePathArg)
    : path.resolve(__dirname, '../../New Villa Pratama 1.xlsx');

  console.log(`\n======================================================`);
  console.log(`ALMAGD Excel Import Tool`);
  console.log(`File:   ${excelPath}`);
  console.log(`Mode:   ${isCommit ? 'COMMIT (Writing to Database)' : 'DRY RUN (No writes, preview only)'}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(excelPath)) {
    console.error(`Error: Excel file not found at "${excelPath}"`);
    process.exit(1);
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'http://127.0.0.1:54321';

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    '';

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const today = new Date().toISOString().slice(0, 10);

  // 1. Fetch units from DB
  console.log(`Connecting to Supabase at ${supabaseUrl}...`);
  const { data: dbUnits, error: unitsErr } = await supabase.from('units').select('id, name, kind');
  if (unitsErr) {
    console.error('Failed to fetch units:', unitsErr);
    process.exit(1);
  }
  const unitsMap = new Map();
  for (const u of dbUnits || []) {
    unitsMap.set(u.name.trim(), u.id);
  }
  console.log(`Loaded ${unitsMap.size} units from DB.`);

  // 2. Fetch existing bookings for idempotency
  const { data: dbBookings, error: bErr } = await supabase.from('bookings').select('id, code, total_amount');
  if (bErr) {
    console.error('Failed to fetch existing bookings:', bErr);
    process.exit(1);
  }
  const existingBookings = new Map();
  for (const b of dbBookings || []) {
    existingBookings.set(b.code, b);
  }
  console.log(`Loaded ${existingBookings.size} existing bookings from DB.`);

  // 3. Fetch existing guests
  const { data: dbGuests, error: gErr } = await supabase.from('guests').select('id, full_name');
  if (gErr) {
    console.error('Failed to fetch existing guests:', gErr);
    process.exit(1);
  }
  const guestsMap = new Map();
  for (const g of dbGuests || []) {
    guestsMap.set(g.full_name.trim().toUpperCase(), g.id);
  }
  console.log(`Loaded ${guestsMap.size} existing guests from DB.`);

  // 4. Read Excel workbook
  console.log(`Reading Excel file...`);
  const fileBuffer = fs.readFileSync(excelPath);
  const wb = XLSX.read(fileBuffer, {
    sheets: ['INPUT BOOKING', 'INPUT BAYAR'],
    cellDates: false,
  });

  const rawBookingRows = XLSX.utils.sheet_to_json(wb.Sheets['INPUT BOOKING'] || {}, {
    header: 1,
    raw: true,
  });
  const rawBayarRows = XLSX.utils.sheet_to_json(wb.Sheets['INPUT BAYAR'] || {}, {
    header: 1,
    raw: true,
  });

  // ----------------------------------------------------
  // Process INPUT BOOKING
  // ----------------------------------------------------
  console.log(`Processing bookings...`);
  const stats = {
    bookingsRead: 0,
    bookingsInserted: 0,
    bookingsAlreadyImported: 0,
    bookingsSkipped: 0,
    guestsCreated: 0,
    paymentsRead: 0,
    paymentsInserted: 0,
    paymentsAlreadyImported: 0,
    paymentsSkipped: 0,
  };

  const report = {
    withoutGuestName: [],
    unknownUnits: [],
    conflicts: [],
    orphanPayments: [],
    amountDiscrepancies: [],
  };

  // Map bookingCode -> { id, total_amount, inserted }
  const bookingCodeMap = new Map();
  for (const [code, b] of existingBookings.entries()) {
    bookingCodeMap.set(code, { id: b.id, total_amount: Number(b.total_amount), existing: true });
  }

  // First collect guests to create
  const guestsToCreate = new Map(); // upperName -> titleCaseName

  for (let r = 4; r < rawBookingRows.length; r++) {
    const row = rawBookingRows[r];
    if (!row) continue;
    const rawCode = row[0] ? String(row[0]).trim() : '';
    const rawUnit = row[2] ? String(row[2]).trim() : '';
    if (!rawCode || rawCode === 'Kode' || !rawUnit) continue;

    stats.bookingsRead++;
    const rawGuest = row[1] ? String(row[1]).trim() : '';
    if (rawGuest) {
      const upper = rawGuest.toUpperCase();
      if (!guestsMap.has(upper) && !guestsToCreate.has(upper)) {
        guestsToCreate.set(upper, toTitleCase(rawGuest));
      }
    }
  }

  // Insert missing guests if commit
  if (isCommit && guestsToCreate.size > 0) {
    console.log(`Inserting ${guestsToCreate.size} unique new guests...`);
    for (const [upper, titleName] of guestsToCreate.entries()) {
      const { data: newGuest, error: insGErr } = await supabase
        .from('guests')
        .insert({ full_name: titleName })
        .select('id, full_name')
        .single();
      if (insGErr) {
        console.error(`Failed to insert guest "${titleName}":`, insGErr);
      } else if (newGuest) {
        guestsMap.set(upper, newGuest.id);
        stats.guestsCreated++;
      }
    }
  } else if (!isCommit) {
    stats.guestsCreated = guestsToCreate.size;
  }

  // Now process each booking row
  for (let r = 4; r < rawBookingRows.length; r++) {
    const row = rawBookingRows[r];
    if (!row) continue;
    const code = row[0] ? String(row[0]).trim() : '';
    const unitName = row[2] ? String(row[2]).trim() : '';
    if (!code || code === 'Kode' || !unitName) continue;

    const guestName = row[1] ? String(row[1]).trim() : '';
    const checkIn = excelSerialToISO(row[3]);
    const checkOut = excelSerialToISO(row[4]);
    const sourceRaw = row[5];
    const totalRaw = row[6];
    const dueRaw = row[7];
    const statusRaw = row[8] ? String(row[8]).trim() : '';
    const notes = row[9] ? String(row[9]).trim() : null;
    const legacyRef = row[21] ? String(row[21]).trim() : null;

    // Unit match
    const unitId = unitsMap.get(unitName);
    if (!unitId) {
      report.unknownUnits.push({ row: r + 1, code, unitName });
      stats.bookingsSkipped++;
      continue;
    }

    // Date check
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      report.conflicts.push({
        row: r + 1,
        code,
        reason: `Invalid dates: checkIn=${checkIn}, checkOut=${checkOut}`,
      });
      stats.bookingsSkipped++;
      continue;
    }

    // Guest lookup
    let guestId = null;
    let needsReview = false;
    if (guestName) {
      guestId = guestsMap.get(guestName.toUpperCase()) || null;
    } else {
      needsReview = true;
      report.withoutGuestName.push({ row: r + 1, code, unitName, checkIn, checkOut });
    }

    // Source map
    const sourceCode = mapSource(sourceRaw);

    // Status map
    let status = 'confirmed';
    if (statusRaw.toLowerCase() === 'batal') {
      status = 'cancelled';
    } else {
      if (checkOut <= today) {
        status = 'checked_out';
      } else if (checkIn <= today && today < checkOut) {
        status = 'checked_in';
      } else {
        status = 'confirmed';
      }
    }

    const totalAmount = Math.max(0, Math.round(Number(totalRaw) || 0));
    const dueDate = dueRaw ? excelSerialToISO(dueRaw) : null;

    // Check idempotency
    if (existingBookings.has(code)) {
      stats.bookingsAlreadyImported++;
      continue;
    }

    // If dry run, record mock ID and continue
    if (!isCommit) {
      bookingCodeMap.set(code, { id: `dry-run-${code}`, total_amount: totalAmount, inserted: true });
      stats.bookingsInserted++;
      continue;
    }

    // Commit insert
    const insertPayload = {
      code,
      unit_id: unitId,
      guest_id: guestId,
      check_in: checkIn,
      check_out: checkOut,
      adults: 1,
      children: 0,
      source_code: sourceCode,
      total_amount: totalAmount,
      due_date: dueDate,
      status,
      notes,
      legacy_ref: legacyRef,
      needs_review: needsReview,
    };

    const { data: insBooking, error: insErr } = await supabase
      .from('bookings')
      .insert(insertPayload)
      .select('id, code, total_amount')
      .single();

    if (insErr) {
      if (insErr.code === '23P01') {
        report.conflicts.push({
          row: r + 1,
          code,
          unitName,
          checkIn,
          checkOut,
          reason: 'Overlap conflict (23P01)',
        });
      } else {
        report.conflicts.push({
          row: r + 1,
          code,
          reason: insErr.message || JSON.stringify(insErr),
        });
      }
      stats.bookingsSkipped++;
    } else if (insBooking) {
      bookingCodeMap.set(code, {
        id: insBooking.id,
        total_amount: Number(insBooking.total_amount),
        inserted: true,
      });
      stats.bookingsInserted++;
    }
  }

  // ----------------------------------------------------
  // Process INPUT BAYAR
  // ----------------------------------------------------
  console.log(`Processing payments...`);
  // Group payments by booking code for sum check
  const paymentsByBooking = new Map();

  // If commit, check existing payments to prevent duplicate payments
  const existingPaymentsMap = new Set();
  if (isCommit) {
    const { data: dbPayments } = await supabase.from('payments').select('booking_id, paid_on, amount, method, reference');
    for (const p of dbPayments || []) {
      existingPaymentsMap.add(`${p.booking_id}_${p.paid_on}_${p.amount}_${p.method}`);
    }
  }

  for (let r = 4; r < rawBayarRows.length; r++) {
    const row = rawBayarRows[r];
    if (!row) continue;
    const bookingCode = row[0] ? String(row[0]).trim() : '';
    const rawAmount = row[3];
    if (!bookingCode || rawAmount === undefined || rawAmount === null || rawAmount === '') continue;

    stats.paymentsRead++;
    const amount = Math.round(Number(rawAmount) || 0);
    if (amount === 0) continue;

    const paidOn = excelSerialToISO(row[2]) || today;
    const method = mapMethod(row[4]);
    const notes = row[5] ? String(row[5]).trim() : null;

    // Track sum
    const currentSum = paymentsByBooking.get(bookingCode) || 0;
    paymentsByBooking.set(bookingCode, currentSum + amount);

    // Match booking
    const bookingEntry = bookingCodeMap.get(bookingCode);
    if (!bookingEntry) {
      report.orphanPayments.push({
        row: r + 1,
        bookingCode,
        amount,
        paidOn,
        method,
      });
      stats.paymentsSkipped++;
      continue;
    }

    if (!isCommit) {
      stats.paymentsInserted++;
      continue;
    }

    // Check if already imported
    const payKey = `${bookingEntry.id}_${paidOn}_${amount}_${method}`;
    if (existingPaymentsMap.has(payKey)) {
      stats.paymentsAlreadyImported++;
      continue;
    }

    const { error: pErr } = await supabase.from('payments').insert({
      booking_id: bookingEntry.id,
      paid_on: paidOn,
      amount,
      method,
      notes,
    });

    if (pErr) {
      console.error(`Failed to insert payment for ${bookingCode}:`, pErr.message);
      stats.paymentsSkipped++;
    } else {
      existingPaymentsMap.add(payKey);
      stats.paymentsInserted++;
    }
  }

  // ----------------------------------------------------
  // Check Total vs Sum(Payments)
  // ----------------------------------------------------
  for (const [code, entry] of bookingCodeMap.entries()) {
    const paidSum = paymentsByBooking.get(code) || 0;
    if (paidSum !== entry.total_amount) {
      report.amountDiscrepancies.push({
        code,
        total: entry.total_amount,
        paid: paidSum,
        diff: entry.total_amount - paidSum,
      });
    }
  }

  // ----------------------------------------------------
  // Reset booking code sequence if commit
  // ----------------------------------------------------
  if (isCommit) {
    console.log(`Resetting booking code sequence via RPC reset_booking_code_seq...`);
    const { error: seqErr } = await supabase.rpc('reset_booking_code_seq');
    if (seqErr) {
      console.warn(`Warning: Could not call reset_booking_code_seq:`, seqErr.message);
    } else {
      console.log(`Booking code sequence successfully synchronized.`);
    }
  }

  // ----------------------------------------------------
  // Generate Markdown Report
  // ----------------------------------------------------
  const reportMd = `# ALMAGD Excel Import Report

**Generated at:** ${new Date().toISOString()}  
**Source file:** \`${excelPath}\`  
**Execution mode:** \`${isCommit ? 'COMMIT' : 'DRY RUN'}\`  

## 1. Summary Statistics

| Metric | Count |
|---|---|
| Total Bookings Read from Sheet | ${stats.bookingsRead} |
| Bookings Inserted | ${stats.bookingsInserted} |
| Bookings Already Imported | ${stats.bookingsAlreadyImported} |
| Bookings Skipped / Conflicted | ${stats.bookingsSkipped} |
| Unique Guests Processed | ${stats.guestsCreated} |
| Total Payments Read from Sheet | ${stats.paymentsRead} |
| Payments Inserted | ${stats.paymentsInserted} |
| Payments Already Imported | ${stats.paymentsAlreadyImported} |
| Payments Skipped / Orphan | ${stats.paymentsSkipped} |

---

## 2. Overlap Conflicts (23P01) & Validation Errors (${report.conflicts.length})

${
  report.conflicts.length === 0
    ? '_No overlap conflicts or date errors detected._'
    : report.conflicts
        .map(
          (c) =>
            `- Row ${c.row} (\`${c.code}\`): ${c.unitName || ''} (${c.checkIn || ''} to ${c.checkOut || ''}) — ${c.reason}`
        )
        .join('\n')
}

---

## 3. Unknown Units (${report.unknownUnits.length})

${
  report.unknownUnits.length === 0
    ? '_All units matched registered database units._'
    : report.unknownUnits.map((u) => `- Row ${u.row} (\`${u.code}\`): Unit "${u.unitName}"`).join('\n')
}

---

## 4. Bookings Without Guest Name (${report.withoutGuestName.length})
_These bookings are marked with \`needs_review = true\` in the system._

${
  report.withoutGuestName.length === 0
    ? '_All bookings had guest names._'
    : report.withoutGuestName
        .map((b) => `- Row ${b.row} (\`${b.code}\`): ${b.unitName} (${b.checkIn} to ${b.checkOut})`)
        .join('\n')
}

---

## 5. Orphan Payments (${report.orphanPayments.length})
_Payments in sheet where the booking code was not found._

${
  report.orphanPayments.length === 0
    ? '_No orphan payments._'
    : report.orphanPayments
        .map((p) => `- Row ${p.row}: Booking \`${p.bookingCode}\`, Amount: ${p.amount}, Date: ${p.paidOn}`)
        .join('\n')
}

---

## 6. Bookings where Total ≠ Sum(Payments) (${report.amountDiscrepancies.length})

${
  report.amountDiscrepancies.length === 0
    ? '_All bookings are completely balanced._'
    : report.amountDiscrepancies
        .map(
          (d) =>
            `- Booking \`${d.code}\`: Total = ${d.total.toLocaleString()} IDR, Paid = ${d.paid.toLocaleString()} IDR (Diff: ${d.diff.toLocaleString()} IDR)`
        )
        .join('\n')
}
`;

  const reportPath = path.resolve(__dirname, 'import-report.md');
  fs.writeFileSync(reportPath, reportMd, 'utf8');

  console.log(`\n======================================================`);
  console.log(`IMPORT COMPLETE!`);
  console.log(`Bookings inserted:         ${stats.bookingsInserted}`);
  console.log(`Bookings already present:  ${stats.bookingsAlreadyImported}`);
  console.log(`Payments inserted:         ${stats.paymentsInserted}`);
  console.log(`Payments already present:  ${stats.paymentsAlreadyImported}`);
  console.log(`Report written to:         ${reportPath}`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error('Fatal error during import:', err);
  process.exit(1);
});
