import * as XLSX from "xlsx";
import { calculateApuResourcePartial } from "../calculations/apu";
import { roundMoney } from "../calculations/money";
import type {
  Presupuesto,
  PresupuestoPartida,
  PresupuestoPartidaRecursoSnapshot,
  PresupuestoVersion,
  PresupuestoVersionPartida,
  PresupuestoVersionPartidaRecurso
} from "@/types/domain";

export type DraftBudgetExportInput = {
  budget: Presupuesto;
  generatedAt?: Date;
  lines: PresupuestoPartida[];
  resources?: PresupuestoPartidaRecursoSnapshot[];
  source: "draft";
};

export type OfficialBudgetExportInput = {
  generatedAt?: Date;
  lines: PresupuestoVersionPartida[];
  resources?: PresupuestoVersionPartidaRecurso[];
  source: "official";
  version: PresupuestoVersion;
};

export type BudgetExportInput = DraftBudgetExportInput | OfficialBudgetExportInput;

export type ClientBudgetExportInput = {
  generatedAt?: Date;
  lines: PresupuestoVersionPartida[];
  resources: PresupuestoVersionPartidaRecurso[];
  version: PresupuestoVersion;
};

type ExportSummaryRow = [string, string | number];
type ExportLineRow = [number, string, string, string, number, number, number, string];
type ExportResourceRow = [number | string, string, string, string, string, number, number, number, string];
type NormalizedBudgetHeader = {
  cliente?: string | null;
  fecha: string;
  moneda: string;
  proyecto: string;
  statusLabel: string;
  title: string;
  ubicacion?: string | null;
  versionLabel: string;
};
type NormalizedTotals = {
  gastosGeneralesPorcentaje: number;
  gastosGeneralesTotal: number;
  igvPorcentaje: number;
  igvTotal: number;
  subtotal: number;
  subtotalConMargen: number;
  total: number;
  utilidadPorcentaje: number;
  utilidadTotal: number;
};
type NormalizedLine = {
  codigo: string;
  id: string;
  metrado: number;
  nombre: string;
  orden: number;
  parcial: number;
  precioUnitario: number;
  unidad: string;
};
type NormalizedResource = {
  cantidad: number;
  costoTransporte: number;
  costoUnitario: number;
  grupo: string;
  lineId: string;
  nombre: string;
  nota?: string | null;
  orden: number;
  parcial: number;
  unidad: string;
};

const currencyFormat = new Intl.NumberFormat("es-PE", {
  currency: "PEN",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency"
});

const numberFormat = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2
});

export function exportBudgetToExcel(input: BudgetExportInput) {
  const rows = sanitizeExcelRows(buildBudgetExportRows(input));
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 18 },
    { wch: 42 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 34 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Presupuesto");
  XLSX.writeFile(workbook, `${buildBudgetFileName(input, input.generatedAt)}.xlsx`);
}

export function openBudgetPrintView(input: BudgetExportInput): boolean {
  const popup = window.open("", "_blank", "width=1100,height=800");

  if (!popup) {
    window.alert("No se pudo abrir la vista imprimible. Revisa el bloqueador de ventanas emergentes.");
    return false;
  }

  popup.document.open();
  popup.document.write(buildBudgetPrintHtml(input));
  popup.document.close();
  popup.focus();

  return true;
}

export function exportClientBudgetToExcel(input: ClientBudgetExportInput) {
  const rows = sanitizeExcelRows(buildClientBudgetExportRows(input));
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 16 },
    { wch: 18 },
    { wch: 42 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 42 },
    { wch: 34 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Presupuesto cliente");
  XLSX.writeFile(workbook, `${buildVersionFileName(input.version, input.generatedAt)}-cliente.xlsx`);
}

export function sanitizeExcelCell<T>(value: T): T | string {
  if (typeof value !== "string") {
    return value;
  }

  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function sanitizeExcelRows(rows: unknown[][]) {
  return rows.map((row) => row.map((cell) => sanitizeExcelCell(cell)));
}

export function openClientBudgetPrintView(input: ClientBudgetExportInput): boolean {
  const popup = window.open("", "_blank", "width=1100,height=800");

  if (!popup) {
    window.alert("No se pudo abrir la vista imprimible. Revisa el bloqueador de ventanas emergentes.");
    return false;
  }

  popup.document.open();
  popup.document.write(buildClientBudgetPrintHtml(input));
  popup.document.close();
  popup.focus();

  return true;
}

export function buildBudgetFileName(input: BudgetExportInput, generatedAt = new Date()) {
  const header = normalizeBudgetHeader(input);
  const date = generatedAt.toISOString().slice(0, 10);
  const suffix = input.source === "draft" ? "borrador" : `v${input.version.numero_version}`;
  const name = `${header.proyecto}-${suffix}-${date}`;

  return slugifyFileName(name) || `presupuesto-${suffix}-${date}`;
}

export function buildVersionFileName(version: PresupuestoVersion, generatedAt = new Date()) {
  const date = generatedAt.toISOString().slice(0, 10);
  const name = `${version.nombre}-v${version.numero_version}-${date}`;

  return slugifyFileName(name) || `presupuesto-version-${date}`;
}

export function buildBudgetExportRows(input: BudgetExportInput) {
  const header = normalizeBudgetHeader(input);
  const totals = normalizeBudgetTotals(input);
  const lines = normalizeBudgetLines(input);
  const resources = normalizeBudgetResources(input);
  const lineRows = lines.map<ExportLineRow>((line) => [
    line.orden,
    line.codigo,
    line.nombre,
    line.unidad,
    line.metrado,
    line.precioUnitario,
    line.parcial,
    ""
  ]);
  const apuRows = buildApuExportRows(lines, resources);

  return [
    [header.title],
    [header.statusLabel],
    [],
    ...buildSummaryRows(header),
    [],
    ["Partidas"],
    ["Orden", "Codigo", "Partida", "Unidad", "Metrado", "Precio unitario", "Parcial", "Nota"],
    ...(lineRows.length > 0 ? lineRows : [["", "", "Sin partidas registradas", "", "", "", "", ""]]),
    [],
    ["Resumen financiero"],
    ["Subtotal", totals.subtotal],
    [`Gastos generales (${totals.gastosGeneralesPorcentaje.toFixed(2)}%)`, totals.gastosGeneralesTotal],
    [`Utilidad (${totals.utilidadPorcentaje.toFixed(2)}%)`, totals.utilidadTotal],
    ["Subtotal con margen", totals.subtotalConMargen],
    [`IGV (${totals.igvPorcentaje.toFixed(2)}%)`, totals.igvTotal],
    ["Total", totals.total],
    [],
    ["Detalle APU por partida"],
    ["Orden partida", "Codigo", "Partida", "Grupo APU", "Recurso", "Cantidad", "Costo unitario", "Parcial", "Nota"],
    ...(apuRows.length > 0 ? apuRows : [["", "", "Sin detalle APU disponible", "", "", "", "", "", ""]])
  ];
}

export function buildClientBudgetExportRows(input: ClientBudgetExportInput) {
  const clientLines = buildClientLineRows(input);
  const apuRows = buildClientApuExportRows(input);

  return [
    ["Presupuesto para cliente"],
    ["VERSION OFICIAL CONGELADA"],
    [],
    ...buildVersionSummaryRows(input.version),
    [],
    ["Partidas"],
    ["Orden", "Codigo", "Partida", "Unidad", "Metrado", "Precio unitario cliente", "Parcial", "Nota"],
    ...(clientLines.length > 0 ? clientLines : [["", "", "Sin partidas registradas", "", "", "", "", ""]]),
    [],
    ["Resumen financiero"],
    ["Subtotal", sumClientSubtotal(input)],
    [`Gastos generales (${input.version.gastos_generales_porcentaje.toFixed(2)}%)`, clientOverhead(input)],
    [`Utilidad (${input.version.utilidad_porcentaje.toFixed(2)}%)`, clientProfit(input)],
    ["Subtotal con margen", roundMoney(sumClientSubtotal(input) + clientOverhead(input) + clientProfit(input))],
    [`IGV (${input.version.igv_porcentaje.toFixed(2)}%)`, clientTax(input)],
    ["Total", clientTotal(input)],
    [],
    ["Detalle APU por partida"],
    ["Orden partida", "Codigo", "Partida", "Grupo APU", "Recurso", "Cantidad", "Precio cliente", "Parcial", "Nota"],
    ...(apuRows.length > 0 ? apuRows : [["", "", "Sin detalle APU disponible", "", "", "", "", "", ""]])
  ];
}

function buildSummaryRows(header: NormalizedBudgetHeader): ExportSummaryRow[] {
  return [
    ["Proyecto", header.proyecto],
    ["Cliente", header.cliente || "Sin cliente"],
    ["Ubicacion", header.ubicacion || "Sin ubicacion"],
    ["Version", header.versionLabel],
    ["Estado exportacion", header.statusLabel],
    ["Fecha", header.fecha],
    ["Moneda", header.moneda]
  ];
}

function buildVersionSummaryRows(version: PresupuestoVersion): ExportSummaryRow[] {
  return [
    ["Proyecto", version.nombre],
    ["Cliente", version.cliente || "Sin cliente"],
    ["Ubicacion", version.ubicacion || "Sin ubicacion"],
    ["Version", `V${version.numero_version}`],
    ["Estado exportacion", "VERSION OFICIAL CONGELADA"],
    ["Fecha", version.emitida_at],
    ["Moneda", version.moneda]
  ];
}

function buildApuExportRows(lines: NormalizedLine[], resources: NormalizedResource[]) {
  return lines.flatMap<ExportResourceRow>((line) => {
    const lineResources = resources
      .filter((resource) => resource.lineId === line.id)
      .sort((first, second) => first.orden - second.orden);

    return lineResources.map<ExportResourceRow>((resource) => [
      line.orden,
      line.codigo,
      line.nombre,
      resource.grupo,
      resource.nombre,
      resource.cantidad,
      resource.costoUnitario + resource.costoTransporte,
      resource.parcial,
      resource.nota || ""
    ]);
  });
}

function buildClientLineRows(input: ClientBudgetExportInput) {
  return input.lines
    .slice()
    .sort((first, second) => first.orden - second.orden)
    .map((line) => {
      const resources = input.resources.filter(
        (resource) => resource.presupuesto_version_partida_id === line.id
      );
      const unitPrice = calculateClientLineUnitPrice(resources);
      const partial = roundMoney(line.metrado * unitPrice);
      const note = buildClientWarningNote(resources);

      return [
        line.orden,
        line.codigo_snapshot,
        line.nombre_snapshot,
        line.unidad_snapshot,
        line.metrado,
        unitPrice,
        partial,
        note
      ];
    });
}

function buildClientApuExportRows(input: ClientBudgetExportInput) {
  return input.lines
    .slice()
    .sort((first, second) => first.orden - second.orden)
    .flatMap<ExportResourceRow>((line) => {
      const resources = input.resources
        .filter((resource) => resource.presupuesto_version_partida_id === line.id)
        .sort((first, second) => first.orden - second.orden);

      return resources.map<ExportResourceRow>((resource) => {
        const price = resource.precio_cliente_snapshot ?? resource.costo_unitario_snapshot + resource.costo_transporte_snapshot;
        const partial = resource.tipo_calculo_apu === "herramientas_porcentaje_mano_obra"
          ? roundMoney((price * (resource.porcentaje_aplicado ?? resource.cantidad)) / 100)
          : roundMoney(resource.cantidad * price);
        return [
          line.orden,
          line.codigo_snapshot,
          line.nombre_snapshot,
          resource.grupo,
          resource.nombre_snapshot,
          resource.cantidad,
          price,
          partial,
          resource.precio_cliente_advertencia_snapshot || ""
        ];
      });
    });
}

function calculateClientLineUnitPrice(resources: PresupuestoVersionPartidaRecurso[]) {
  return resources.reduce(
    (total, resource) =>
      total +
      roundMoney(
        resource.cantidad *
          (resource.precio_cliente_snapshot ??
            resource.costo_unitario_snapshot + resource.costo_transporte_snapshot)
      ),
    0
  );
}

function buildClientWarningNote(resources: PresupuestoVersionPartidaRecurso[]) {
  return Array.from(
    new Set(
      resources
        .map((resource) => resource.precio_cliente_advertencia_snapshot)
        .filter((note): note is string => Boolean(note))
    )
  ).join(" ");
}

function sumClientSubtotal(input: ClientBudgetExportInput) {
  return roundMoney(buildClientLineRows(input).reduce((total, row) => total + Number(row[6] || 0), 0));
}

function clientOverhead(input: ClientBudgetExportInput) {
  return roundMoney((sumClientSubtotal(input) * input.version.gastos_generales_porcentaje) / 100);
}

function clientProfit(input: ClientBudgetExportInput) {
  return roundMoney((sumClientSubtotal(input) * input.version.utilidad_porcentaje) / 100);
}

function clientTax(input: ClientBudgetExportInput) {
  const subtotal = sumClientSubtotal(input);
  return roundMoney(
    ((subtotal + clientOverhead(input) + clientProfit(input)) * input.version.igv_porcentaje) / 100
  );
}

function clientTotal(input: ClientBudgetExportInput) {
  const subtotal = sumClientSubtotal(input);
  return roundMoney(subtotal + clientOverhead(input) + clientProfit(input) + clientTax(input));
}

export function buildBudgetPrintHtml(input: BudgetExportInput) {
  const header = normalizeBudgetHeader(input);
  const totals = normalizeBudgetTotals(input);
  const lines = normalizeBudgetLines(input);
  const resources = normalizeBudgetResources(input);

  return buildPrintShell({
    apuRows: buildApuPrintRows(lines, resources),
    header,
    lineRows: buildLinePrintRows(lines),
    title: header.title,
    totalsRows: buildTotalsPrintRows(totals)
  });
}

export function buildClientBudgetPrintHtml(input: ClientBudgetExportInput) {
  const header: NormalizedBudgetHeader = {
    cliente: input.version.cliente,
    fecha: input.version.emitida_at,
    moneda: input.version.moneda,
    proyecto: input.version.nombre,
    statusLabel: "VERSION OFICIAL CONGELADA",
    title: "Presupuesto para cliente",
    ubicacion: input.version.ubicacion,
    versionLabel: `V${input.version.numero_version}`
  };
  const lineRows = buildClientLineRows(input)
    .map((line) => {
      const hasWarning = Boolean(line[7]);
      return `
              <tr class="${hasWarning ? "warning" : ""}">
                <td>${line[0]}</td>
                <td>${escapeHtml(String(line[1]))}</td>
                <td>${escapeHtml(String(line[2]))}</td>
                <td>${escapeHtml(String(line[3]))}</td>
                <td class="number">${numberFormat.format(Number(line[4]))}</td>
                <td class="number">${currencyFormat.format(Number(line[5]))}</td>
                <td class="number">${currencyFormat.format(Number(line[6]))}</td>
                <td>${escapeHtml(String(line[7] || ""))}</td>
              </tr>`;
    })
    .join("");
  const apuRows = buildClientApuExportRows(input)
    .map((row) => {
      const hasWarning = Boolean(row[8]);
      return `
              <tr class="${hasWarning ? "warning" : ""}">
                <td>${row[0]}</td>
                <td>${escapeHtml(String(row[1]))}</td>
                <td>${escapeHtml(String(row[2]))}</td>
                <td>${escapeHtml(String(row[3]))}</td>
                <td>${escapeHtml(String(row[4]))}</td>
                <td class="number">${numberFormat.format(Number(row[5]))}</td>
                <td class="number">${currencyFormat.format(Number(row[6]))}</td>
                <td class="number">${currencyFormat.format(Number(row[7]))}</td>
                <td>${escapeHtml(String(row[8] || ""))}</td>
              </tr>`;
    })
    .join("");

  return buildPrintShell({
    apuRows: apuRows || `<tr><td class="empty" colspan="9">Sin detalle APU disponible.</td></tr>`,
    header,
    lineRows: lineRows || `<tr><td class="empty" colspan="8">Sin partidas registradas.</td></tr>`,
    title: "Presupuesto para cliente",
    totalsRows: `
          <tr><td>Subtotal</td><td class="number">${currencyFormat.format(sumClientSubtotal(input))}</td></tr>
          <tr><td>Gastos generales (${numberFormat.format(input.version.gastos_generales_porcentaje)}%)</td><td class="number">${currencyFormat.format(clientOverhead(input))}</td></tr>
          <tr><td>Utilidad (${numberFormat.format(input.version.utilidad_porcentaje)}%)</td><td class="number">${currencyFormat.format(clientProfit(input))}</td></tr>
          <tr><td>Subtotal con margen</td><td class="number">${currencyFormat.format(roundMoney(sumClientSubtotal(input) + clientOverhead(input) + clientProfit(input)))}</td></tr>
          <tr><td>IGV (${numberFormat.format(input.version.igv_porcentaje)}%)</td><td class="number">${currencyFormat.format(clientTax(input))}</td></tr>
          <tr><td>Total</td><td class="number">${currencyFormat.format(clientTotal(input))}</td></tr>`
  });
}

function buildPrintShell({
  apuRows,
  header,
  lineRows,
  title,
  totalsRows
}: {
  apuRows: string;
  header: NormalizedBudgetHeader;
  lineRows: string;
  title: string;
  totalsRows: string;
}) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(header.proyecto)} - ${escapeHtml(title)}</title>
    <style>
      :root { color: #0f172a; font-family: Arial, Helvetica, sans-serif; }
      body { background: #f8fafc; margin: 0; padding: 32px; }
      main { background: #ffffff; border: 1px solid #e2e8f0; margin: 0 auto; max-width: 1080px; padding: 32px; }
      header { border-bottom: 2px solid #1d4ed8; margin-bottom: 28px; padding-bottom: 18px; }
      h1 { font-size: 28px; margin: 0; }
      h2 { font-size: 16px; margin: 26px 0 12px; }
      .badge { background: #dbeafe; border-radius: 999px; color: #1e40af; display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: .04em; margin-top: 10px; padding: 6px 10px; text-transform: uppercase; }
      .draft { background: #fef3c7; color: #92400e; }
      .meta { display: grid; gap: 10px 24px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 18px; }
      .meta div { color: #475569; font-size: 13px; }
      .meta strong { color: #0f172a; display: block; font-size: 11px; letter-spacing: .04em; margin-bottom: 4px; text-transform: uppercase; }
      table { border-collapse: collapse; font-size: 12px; width: 100%; }
      th { background: #eff6ff; color: #1e3a8a; font-size: 11px; text-align: left; text-transform: uppercase; }
      th, td { border: 1px solid #dbe3ef; padding: 9px 10px; vertical-align: top; }
      .number { text-align: right; white-space: nowrap; }
      .empty { color: #64748b; padding: 20px; text-align: center; }
      .warning td { background: #fef2f2; color: #991b1b; }
      .totals { margin-left: auto; margin-top: 20px; max-width: 430px; }
      .totals td:first-child { color: #475569; }
      .totals tr:last-child td { color: #1d4ed8; font-size: 16px; font-weight: 700; }
      .actions { display: flex; justify-content: flex-end; margin: 0 auto 16px; max-width: 1144px; }
      button { background: #1d4ed8; border: 0; border-radius: 10px; color: white; cursor: pointer; font-size: 14px; font-weight: 700; padding: 12px 16px; }
      @media print { body { background: #ffffff; padding: 0; } main { border: 0; max-width: none; padding: 0; } .actions { display: none; } }
    </style>
  </head>
  <body>
    <div class="actions"><button onclick="window.print()">Guardar como PDF</button></div>
    <main>
      <header>
        <h1>${escapeHtml(title)}</h1>
        <span class="badge ${header.statusLabel === "BORRADOR" ? "draft" : ""}">${escapeHtml(header.statusLabel)}</span>
        <div class="meta">
          <div><strong>Proyecto</strong>${escapeHtml(header.proyecto)}</div>
          <div><strong>Cliente</strong>${escapeHtml(header.cliente || "Sin cliente")}</div>
          <div><strong>Ubicacion</strong>${escapeHtml(header.ubicacion || "Sin ubicacion")}</div>
          <div><strong>Version</strong>${escapeHtml(header.versionLabel)}</div>
          <div><strong>Fecha</strong>${escapeHtml(header.fecha)}</div>
          <div><strong>Moneda</strong>${escapeHtml(header.moneda)}</div>
        </div>
      </header>
      <h2>Partidas</h2>
      <table>
        <thead>
          <tr>
            <th>Orden</th><th>Codigo</th><th>Partida</th><th>Unidad</th>
            <th class="number">Metrado</th><th class="number">Precio unitario</th><th class="number">Parcial</th><th>Nota</th>
          </tr>
        </thead>
        <tbody>${lineRows}</tbody>
      </table>
      <h2>Resumen financiero</h2>
      <table class="totals"><tbody>${totalsRows}</tbody></table>
      <h2>Detalle APU por partida</h2>
      <table>
        <thead>
          <tr>
            <th>Orden partida</th><th>Codigo</th><th>Partida</th><th>Grupo APU</th><th>Recurso</th>
            <th class="number">Cantidad</th><th class="number">Precio</th><th class="number">Parcial</th><th>Nota</th>
          </tr>
        </thead>
        <tbody>${apuRows}</tbody>
      </table>
    </main>
  </body>
</html>`;
}

function buildLinePrintRows(lines: NormalizedLine[]) {
  return lines.length > 0
    ? lines
        .map(
          (line) => `
              <tr>
                <td>${line.orden}</td>
                <td>${escapeHtml(line.codigo)}</td>
                <td>${escapeHtml(line.nombre)}</td>
                <td>${escapeHtml(line.unidad)}</td>
                <td class="number">${numberFormat.format(line.metrado)}</td>
                <td class="number">${currencyFormat.format(line.precioUnitario)}</td>
                <td class="number">${currencyFormat.format(line.parcial)}</td>
                <td></td>
              </tr>`
        )
        .join("")
    : `<tr><td class="empty" colspan="8">Sin partidas registradas.</td></tr>`;
}

function buildApuPrintRows(lines: NormalizedLine[], resources: NormalizedResource[]) {
  const rows = buildApuExportRows(lines, resources);

  return rows.length > 0
    ? rows
        .map(
          (row) => `
              <tr>
                <td>${row[0]}</td>
                <td>${escapeHtml(String(row[1]))}</td>
                <td>${escapeHtml(String(row[2]))}</td>
                <td>${escapeHtml(String(row[3]))}</td>
                <td>${escapeHtml(String(row[4]))}</td>
                <td class="number">${numberFormat.format(Number(row[5]))}</td>
                <td class="number">${currencyFormat.format(Number(row[6]))}</td>
                <td class="number">${currencyFormat.format(Number(row[7]))}</td>
                <td>${escapeHtml(String(row[8] || ""))}</td>
              </tr>`
        )
        .join("")
    : `<tr><td class="empty" colspan="9">Sin detalle APU disponible.</td></tr>`;
}

function buildTotalsPrintRows(totals: NormalizedTotals) {
  return `
          <tr><td>Subtotal</td><td class="number">${currencyFormat.format(totals.subtotal)}</td></tr>
          <tr><td>Gastos generales (${numberFormat.format(totals.gastosGeneralesPorcentaje)}%)</td><td class="number">${currencyFormat.format(totals.gastosGeneralesTotal)}</td></tr>
          <tr><td>Utilidad (${numberFormat.format(totals.utilidadPorcentaje)}%)</td><td class="number">${currencyFormat.format(totals.utilidadTotal)}</td></tr>
          <tr><td>Subtotal con margen</td><td class="number">${currencyFormat.format(totals.subtotalConMargen)}</td></tr>
          <tr><td>IGV (${numberFormat.format(totals.igvPorcentaje)}%)</td><td class="number">${currencyFormat.format(totals.igvTotal)}</td></tr>
          <tr><td>Total</td><td class="number">${currencyFormat.format(totals.total)}</td></tr>`;
}

function normalizeBudgetHeader(input: BudgetExportInput): NormalizedBudgetHeader {
  if (input.source === "draft") {
    return {
      cliente: input.budget.cliente,
      fecha: input.budget.updated_at,
      moneda: input.budget.moneda,
      proyecto: input.budget.proyecto_nombre,
      statusLabel: "BORRADOR",
      title: "Presupuesto resumido",
      ubicacion: input.budget.ubicacion,
      versionLabel: input.budget.version
    };
  }

  return {
    cliente: input.version.cliente,
    fecha: input.version.emitida_at,
    moneda: input.version.moneda,
    proyecto: input.version.nombre,
    statusLabel: "VERSION OFICIAL CONGELADA",
    title: "Presupuesto resumido",
    ubicacion: input.version.ubicacion,
    versionLabel: `V${input.version.numero_version}`
  };
}

function normalizeBudgetTotals(input: BudgetExportInput): NormalizedTotals {
  const source = input.source === "draft" ? input.budget : input.version;

  return {
    gastosGeneralesPorcentaje: source.gastos_generales_porcentaje,
    gastosGeneralesTotal: source.gastos_generales_total,
    igvPorcentaje: source.igv_porcentaje,
    igvTotal: source.igv_total,
    subtotal: source.subtotal,
    subtotalConMargen: source.subtotal_con_margen,
    total: source.total,
    utilidadPorcentaje: source.utilidad_porcentaje,
    utilidadTotal: source.utilidad_total
  };
}

function normalizeBudgetLines(input: BudgetExportInput): NormalizedLine[] {
  return input.lines
    .slice()
    .sort((first, second) => first.orden - second.orden)
    .map((line) => ({
      codigo: line.codigo_snapshot,
      id: line.id,
      metrado: line.metrado,
      nombre: line.nombre_snapshot,
      orden: line.orden,
      parcial: "parcial" in line ? line.parcial : line.parcial_snapshot,
      precioUnitario: line.precio_unitario_snapshot,
      unidad: line.unidad_snapshot
    }));
}

function normalizeBudgetResources(input: BudgetExportInput): NormalizedResource[] {
  const resources = input.resources || [];

  return resources.map((resource) => {
    const costoUnitario = resource.costo_unitario_snapshot;
    const costoTransporte = resource.costo_transporte_snapshot;
    const parcial = resource.parcial_snapshot ?? calculateApuResourcePartial({
      cantidad: resource.cantidad,
      costo_transporte_snapshot: costoTransporte,
      costo_unitario_snapshot: costoUnitario,
      parcial: resource.parcial_snapshot,
      tipo_calculo_apu: resource.tipo_calculo_apu
    });

    return {
      cantidad: resource.cantidad,
      costoTransporte,
      costoUnitario,
      grupo: resource.grupo,
      lineId: "presupuesto_partida_id" in resource
        ? resource.presupuesto_partida_id
        : resource.presupuesto_version_partida_id,
      nombre: resource.nombre_snapshot,
      nota: "motivo_precio_fijado_snapshot" in resource ? resource.motivo_precio_fijado_snapshot : null,
      orden: resource.orden,
      parcial,
      unidad: resource.unidad_snapshot
    };
  });
}

function slugifyFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value: string) {
  // Solo para nodos de texto HTML en vistas imprimibles, no para URLs ni scripts.
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/`/g, "&#096;")
    .replace(/=/g, "&#061;");
}
