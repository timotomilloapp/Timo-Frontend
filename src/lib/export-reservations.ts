import * as XLSX from 'xlsx';
import { ReservationResponse } from '@/features/reservations/hooks/useReservations';

interface ExportRow {
    'Nombre': string;
    'Cédula (CC)': string;
    'Proteína': string;
    'Estado': string;
    'Fecha del Menú': string;
    'Fecha de Reserva': string;
}

function formatStatus(status: ReservationResponse['status']): string {
    const map: Record<ReservationResponse['status'], string> = {
        RESERVADA: 'Reservada',
        SERVIDA: 'Servida',
        CANCELADA: 'Cancelada',
        AUTO_ASIGNADA: 'Auto-asignada',
    };
    return map[status] ?? status;
}

function formatMenuDate(dateStr: string): string {
    // dateStr may be 'YYYY-MM-DD' or full ISO '2026-04-14T00:00:00.000Z'
    // Take only the date portion before any 'T'
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-');
    const shortYear = year.slice(-2); // last 2 digits e.g. '26'
    return `${day}/${month}/${shortYear}`;
}

function formatReservedAt(isoString: string): string {
    const d = new Date(isoString);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hh}:${mm}`;
}

function buildRows(reservations: ReservationResponse[]): ExportRow[] {
    return reservations.map((r) => ({
        'Nombre': r.name || '—',
        'Cédula (CC)': r.cc,
        'Proteína': r.proteinType.name,
        'Estado': formatStatus(r.status),
        'Fecha del Menú': formatMenuDate(r.menu.date),
        'Fecha de Reserva': formatReservedAt(r.createdAt),
    }));
}

/**
 * Exports reservations to an .xlsx file and triggers a browser download.
 */
export function exportReservationsToXlsx(
    reservations: ReservationResponse[],
    menuDate?: string,
): void {
    const rows = buildRows(reservations);
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-width columns
    const colWidths = [
        { wch: 30 }, // Nombre
        { wch: 16 }, // CC
        { wch: 22 }, // Proteína
        { wch: 14 }, // Estado
        { wch: 16 }, // Fecha Menú
        { wch: 20 }, // Fecha Reserva
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reservaciones');

    const dateLabel = menuDate ? `_${menuDate}` : '';
    XLSX.writeFile(workbook, `reservaciones${dateLabel}.xlsx`);
}

/**
 * Exports reservations to a .csv file and triggers a browser download.
 */
export function exportReservationsToCsv(
    reservations: ReservationResponse[],
    menuDate?: string,
): void {
    const rows = buildRows(reservations);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateLabel = menuDate ? `_${menuDate}` : '';
    link.href = url;
    link.download = `reservaciones${dateLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
