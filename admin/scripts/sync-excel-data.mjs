import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function excelSerialToISO(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return new Date(Date.UTC(1899, 11, 30) + val * 86400000).toISOString().slice(0, 10);
  }
  if (val instanceof Date) return val.toISOString().slice(0, 10);
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
  if (method === 'app') return 'app';
  return 'other';
}

async function main() {
  const envPath = path.resolve(__dirname, '../.env.local');
  const env = fs.readFileSync(envPath, 'utf8');
  const url = env.match(/VITE_SUPABASE_URL=([^\s]+)/)[1];
  const key = env.match(/VITE_SUPABASE_ANON_KEY=([^\s]+)/)[1];

  const excelPath = path.resolve(__dirname, '../../New Villa Pratama 1.xlsx');
  console.log('Connecting to Supabase at', url);
  console.log('Reading Excel from', excelPath);

  const supabase = createClient(url, key);
  const { data: auth, error: aErr } = await supabase.auth.signInWithPassword({
    email: 'manager@almagd.test',
    password: 'password123',
  });
  if (aErr) {
    console.error('Auth error:', aErr);
    process.exit(1);
  }
  console.log('Authenticated as Manager:', auth.user.email);

  const today = '2026-10-30';

  // 1. Fetch units
  const { data: dbUnits } = await supabase.from('units').select('id, name, kind, active');
  const unitsMap = new Map();
  dbUnits.forEach((u) => unitsMap.set(u.name.trim(), u.id));

  // 2. Fetch guests
  const { data: dbGuests } = await supabase.from('guests').select('id, full_name');
  const guestsMap = new Map();
  dbGuests.forEach((g) => guestsMap.set(g.full_name.trim().toUpperCase(), g.id));

  // 3. Fetch bookings
  const { data: dbBookings } = await supabase
    .from('bookings')
    .select('id, code, total_amount, check_in, check_out, unit_id, status');
  const dbBookingMap = new Map();
  dbBookings.forEach((b) => dbBookingMap.set(b.code, b));

  // 4. Read Excel
  const fileBuffer = fs.readFileSync(excelPath);
  const wb = XLSX.read(fileBuffer, { cellDates: false });
  const rawBookingRows = XLSX.utils.sheet_to_json(wb.Sheets['INPUT BOOKING'], { header: 1 });
  const rawBayarRows = XLSX.utils.sheet_to_json(wb.Sheets['INPUT BAYAR'], { header: 1 });

  // Collect and insert new guests
  const newGuestsToInsert = new Map();
  for (let r = 4; r < rawBookingRows.length; r++) {
    const row = rawBookingRows[r];
    if (!row || !row[0] || !row[2]) continue;
    const rawGuest = row[1] ? String(row[1]).trim() : '';
    if (rawGuest) {
      const upper = rawGuest.toUpperCase();
      if (!guestsMap.has(upper) && !newGuestsToInsert.has(upper)) {
        newGuestsToInsert.set(upper, toTitleCase(rawGuest));
      }
    }
  }

  if (newGuestsToInsert.size > 0) {
    console.log(`Inserting ${newGuestsToInsert.size} new guests...`);
    for (const [upper, titleName] of newGuestsToInsert.entries()) {
      const { data: insGuest, error: gErr } = await supabase
        .from('guests')
        .insert({ full_name: titleName })
        .select('id, full_name')
        .single();
      if (insGuest) {
        guestsMap.set(upper, insGuest.id);
      } else if (gErr) {
        console.warn('Guest insert error:', titleName, gErr.message);
      }
    }
  }

  // Process bookings
  let insertedBookingsCount = 0;
  let updatedBookingsCount = 0;

  for (let r = 4; r < rawBookingRows.length; r++) {
    const row = rawBookingRows[r];
    if (!row) continue;
    const code = row[0] ? String(row[0]).trim() : '';
    const unitName = row[2] ? String(row[2]).trim() : '';
    const rawCheckIn = row[3];
    const rawCheckOut = row[4];
    if (!code || code === 'Kode' || !unitName || !rawCheckIn || !rawCheckOut) continue;

    const checkIn = excelSerialToISO(rawCheckIn);
    const checkOut = excelSerialToISO(rawCheckOut);
    if (!checkIn || !checkOut || checkOut <= checkIn) continue;

    const unitId = unitsMap.get(unitName);
    if (!unitId) {
      console.warn('Unknown unit in Excel:', unitName, 'for code', code);
      continue;
    }

    const guestName = row[1] ? String(row[1]).trim() : '';
    const guestId = guestName ? guestsMap.get(guestName.toUpperCase()) || null : null;
    const totalAmount = Math.max(0, Math.round(Number(row[6]) || 0));
    const sourceCode = mapSource(row[5]);
    const dueRaw = row[7];
    const dueDate = dueRaw ? excelSerialToISO(dueRaw) : null;
    const statusRaw = row[8] ? String(row[8]).trim().toLowerCase() : '';
    const notes = row[9] ? String(row[9]).trim() : null;

    let status = 'confirmed';
    if (statusRaw === 'batal' || statusRaw === 'cancelled') {
      status = 'cancelled';
    } else if (checkOut <= today) {
      // Check-out date has passed -> automatically checked_out
      status = 'checked_out';
    } else if (checkIn <= today && today < checkOut) {
      status = 'checked_in';
    } else {
      status = 'confirmed';
    }

    if (!dbBookingMap.has(code)) {
      // Insert new booking
      const { data: insB, error: bErr } = await supabase
        .from('bookings')
        .insert({
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
          needs_review: !guestId,
        })
        .select('id, code, total_amount')
        .single();

      if (insB) {
        dbBookingMap.set(code, insB);
        insertedBookingsCount++;
      } else if (bErr) {
        console.warn('Booking insert error for', code, bErr.message);
      }
    } else {
      // Update existing booking if needed
      const existing = dbBookingMap.get(code);
      const updates = {};
      if (existing.total_amount !== totalAmount) updates.total_amount = totalAmount;
      if (existing.check_in !== checkIn) updates.check_in = checkIn;
      if (existing.check_out !== checkOut) updates.check_out = checkOut;
      if (existing.unit_id !== unitId) updates.unit_id = unitId;

      if (Object.keys(updates).length > 0) {
        const { error: uErr } = await supabase.from('bookings').update(updates).eq('id', existing.id);
        if (!uErr) updatedBookingsCount++;
      }
    }
  }

  console.log(`Bookings synchronized: +${insertedBookingsCount} inserted, ${updatedBookingsCount} updated.`);

  // Process payments
  const { data: dbPayments } = await supabase.from('payments').select('booking_id, paid_on, amount, method');
  const existingPayKeys = new Set();
  (dbPayments || []).forEach((p) => {
    existingPayKeys.add(`${p.booking_id}_${p.paid_on}_${p.amount}_${p.method}`);
  });

  let insertedPaymentsCount = 0;
  for (let r = 4; r < rawBayarRows.length; r++) {
    const row = rawBayarRows[r];
    if (!row) continue;
    const bookingCode = row[0] ? String(row[0]).trim() : '';
    const rawAmount = row[3];
    if (!bookingCode || rawAmount === undefined || rawAmount === null || rawAmount === '') continue;

    const amount = Math.round(Number(rawAmount) || 0);
    if (amount <= 0) continue;

    const paidOn = excelSerialToISO(row[2]) || today;
    const method = mapMethod(row[4]);
    const notes = row[5] ? String(row[5]).trim() : null;

    const booking = dbBookingMap.get(bookingCode);
    if (!booking) {
      console.warn('Orphan payment in Excel for missing booking:', bookingCode);
      continue;
    }

    const payKey = `${booking.id}_${paidOn}_${amount}_${method}`;
    if (!existingPayKeys.has(payKey)) {
      const { error: pErr } = await supabase.from('payments').insert({
        booking_id: booking.id,
        paid_on: paidOn,
        amount,
        method,
        notes,
      });

      if (!pErr) {
        existingPayKeys.add(payKey);
        insertedPaymentsCount++;
      } else {
        console.warn('Payment insert error:', bookingCode, pErr.message);
      }
    }
  }

  console.log(`Payments synchronized: +${insertedPaymentsCount} new payments inserted.`);

  // 5. Ensure all overdue bookings are marked checked_out
  const { data: overdue } = await supabase
    .from('bookings')
    .select('id, code')
    .lte('check_out', today)
    .in('status', ['confirmed', 'checked_in']);

  if (overdue && overdue.length > 0) {
    console.log(`Checking out ${overdue.length} overdue bookings...`);
    await supabase
      .from('bookings')
      .update({ status: 'checked_out' })
      .in('id', overdue.map((b) => b.id));
  }

  // 6. Ensure Villas 20, 21, 22, 23, 24 are closed for maintenance
  const maintenanceUnitIds = [
    77, 78, 79, 80, // Villa 20 + 3 rooms
    81, 82, 83,     // Villa 21 + 2 rooms
    84, 85, 86,     // Villa 22 + 2 rooms
    87, 88,         // Villa 23 + 1 room
    89, 90,         // Villa 24 + 1 room
  ];

  await supabase
    .from('units')
    .update({ active: false })
    .in('id', maintenanceUnitIds);

  const { data: activeRooms } = await supabase
    .from('units')
    .select('id')
    .eq('kind', 'room')
    .eq('active', true);

  console.log('=== SYNC COMPLETED ===');
  console.log(`Total Active Operational Rooms: ${activeRooms ? activeRooms.length : 0}`);
  console.log('Maintenance Villas (Closed): Villa 20, Villa 21, Villa 22, Villa 23, Villa 24');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
