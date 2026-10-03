import * as XLSX from "xlsx";

export function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = String(r[h] ?? "").replace(/"/g, '""');
        return `"${v}"`;
      }).join(",")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadExcel(rows: Record<string, unknown>[], sheetName: string, filename: string) {
  if (!rows.length) return;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function openPrintWindow(title: string, tableHtml: string) {
  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;margin:20px;color:#111}
  h1{font-size:16px;margin-bottom:4px}
  .meta{color:#666;font-size:10px;margin-bottom:14px}
  table{border-collapse:collapse;width:100%}
  th{background:#f0f0f0;font-weight:bold;text-align:left;padding:6px 8px;border:1px solid #ddd}
  td{padding:5px 8px;border:1px solid #ddd;vertical-align:top}
  tr:nth-child(even) td{background:#f9f9f9}
  @media print{body{margin:0}}
</style>
</head><body>
<h1>${title}</h1>
<p class="meta">Generated: ${new Date().toLocaleString()}</p>
${tableHtml}
<script>window.onload=function(){window.print();}<\/script>
</body></html>`;
  const w = window.open("", "_blank");
  w?.document.write(html);
  w?.document.close();
}
