import * as XLSX from 'xlsx';

interface ExportAppetizerRow {
    'Unidades': number;
    'Área': string;
    'Fecha a Pedir': string;
    'Estado': string;
    'Observaciones': string;
    'Fecha Creación': string;
}

function formatStatus(status: string): string {
    const map: Record<string, string> = {
        PENDIENTE: 'Pendiente',
        ENTREGADO: 'Entregado',
    };
    return map[status] ?? status;
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-');
    const shortYear = year.slice(-2);
    return `${day}/${month}/${shortYear}`;
}

function formatDateTime(isoString: string): string {
    if (!isoString) return '—';
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hh}:${mm}`;
}

function buildRows(appetizers: any[]): ExportAppetizerRow[] {
    return appetizers.map((a) => ({
        'Unidades': a.quantity,
        'Área': a.area?.name || '—',
        'Fecha a Pedir': formatDate(a.date),
        'Estado': formatStatus(a.status),
        'Observaciones': a.observations || '—',
        'Fecha Creación': formatDateTime(a.createdAt),
    }));
}

function getFilename(extension: 'xlsx' | 'csv'): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const dateStr = formatter.format(new Date());
    return `resumen_refrigerios_${dateStr}.${extension}`;
}

/**
 * Exports appetizers to an .xlsx file and triggers a browser download.
 */
export function exportAppetizersToXlsx(appetizers: any[]): void {
    const rows = buildRows(appetizers);
    const worksheet = XLSX.utils.json_to_sheet(rows);

    const colWidths = [
        { wch: 10 }, // Unidades
        { wch: 22 }, // Área
        { wch: 16 }, // Fecha a Pedir
        { wch: 14 }, // Estado
        { wch: 40 }, // Observaciones
        { wch: 22 }, // Fecha Creación
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Refrigerios');

    XLSX.writeFile(workbook, getFilename('xlsx'));
}

/**
 * Exports appetizers to a .csv file and triggers a browser download.
 */
export function exportAppetizersToCsv(appetizers: any[]): void {
    const rows = buildRows(appetizers);
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFilename('csv');
    link.click();
    URL.revokeObjectURL(url);
}
