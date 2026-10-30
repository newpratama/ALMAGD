import * as XLSX from 'xlsx';
import type { BookingOverview } from '../api/bookings';

export function exportBookingsToXlsx(bookings: BookingOverview[], filename = 'bookings-export.xlsx') {
  const rows = bookings.map((b) => ({
    Kode: b.code,
    Tamu: b.guest_name || '—',
    Telepon: b.guest_phone || '—',
    Unit: b.unit_name,
    'Check-in': b.check_in,
    'Check-out': b.check_out,
    Malam: b.nights,
    Sumber: b.source_code,
    Status: b.status,
    'Total (IDR)': Number(b.total_amount || 0),
    'Dibayar (IDR)': Number(b.paid || 0),
    'Sisa (IDR)': Number(b.balance || 0),
    'Status Bayar': b.payment_status,
    'No. OTA': b.ota_reference || '—',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');

  XLSX.writeFile(workbook, filename);
}
