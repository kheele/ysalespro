// Client-side export helper utilities for CSV, Excel, and PDF export

export function exportToCSV(filename: string, data: Record<string, any>[]): void {
  if (typeof window === "undefined" || !data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(","));
  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(filename: string, sheetName: string, data: Record<string, any>[]): void {
  if (typeof window === "undefined" || !data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  let table = `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
  data.forEach(row => {
    table += `<tr>${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`;
  });
  table += '</tbody></table>';

  const blob = new Blob([table], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPDFPrint(title: string): void {
  if (typeof window === "undefined") return;
  window.print();
}

export const exportCSV = exportToCSV;
export const exportExcel = exportToExcel;
export const exportPDF = exportToPDFPrint;
