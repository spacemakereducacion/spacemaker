import ExcelJS from "exceljs";

export async function toCsv(rows: Record<string, string | number | null | undefined>[]) {
  if (rows.length === 0) return "sin_datos\n";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? "";
          const text = String(value).replaceAll('"', '""');
          return `"${text}"`;
        })
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export async function toExcel(params: {
  sheet: string;
  rows: Record<string, string | number | null | undefined>[];
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Space Maker Educación";
  const sheet = workbook.addWorksheet(params.sheet);
  if (params.rows.length === 0) {
    sheet.addRow(["Sin datos"]);
  } else {
    const headers = Object.keys(params.rows[0]);
    sheet.addRow(headers);
    for (const row of params.rows) {
      sheet.addRow(headers.map((header) => row[header] ?? ""));
    }
    sheet.getRow(1).font = { bold: true };
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
