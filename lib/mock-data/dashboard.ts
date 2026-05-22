import { Boxes, ClipboardList, FileSpreadsheet, TrendingUp } from "lucide-react";

export const currentProject = {
  name: "Edificio Multifamiliar Los Olivos",
  shortName: "Los Olivos",
  progress: 65,
  location: "Lima, Perú"
};

export const userProfile = {
  name: "Juan Pérez",
  role: "Administrador"
};

export const kpis = [
  {
    label: "Presupuestos activos",
    value: "3",
    link: "Ver todos",
    icon: ClipboardList,
    tone: "violet" as const
  },
  {
    label: "Recursos",
    value: "1,248",
    link: "Ver recursos",
    icon: Boxes,
    tone: "amber" as const
  },
  {
    label: "Partidas",
    value: "156",
    link: "Ver partidas",
    icon: FileSpreadsheet,
    tone: "sky" as const
  },
  {
    label: "Variación de precios (30 días)",
    value: "+2.45%",
    link: "Ver historial",
    icon: TrendingUp,
    tone: "green" as const
  }
];

export const budgetRows = [
  {
    code: "01.01.01",
    item: "Tarrajeo en muros interiores",
    unit: "m²",
    metrado: "350.00",
    unitPrice: "28.50",
    partial: "9,975.00"
  },
  {
    code: "01.01.02",
    item: "Piso porcelanato 60x60",
    unit: "m²",
    metrado: "120.00",
    unitPrice: "85.00",
    partial: "10,200.00"
  },
  {
    code: "01.01.03",
    item: "Pintura látex en muros y cielos",
    unit: "m²",
    metrado: "450.00",
    unitPrice: "15.80",
    partial: "7,110.00"
  },
  {
    code: "01.01.04",
    item: "Muro drywall e=12.5mm",
    unit: "m²",
    metrado: "85.00",
    unitPrice: "68.00",
    partial: "5,780.00"
  },
  {
    code: "01.01.05",
    item: "Puerta de madera contraplacada",
    unit: "und",
    metrado: "12.00",
    unitPrice: "320.00",
    partial: "3,840.00"
  }
];

export const budgetSummary = [
  { label: "Subtotal", value: "S/ 123,456.78" },
  { label: "Gastos Generales (10.00%)", value: "S/ 12,345.68" },
  { label: "Utilidad (10.00%)", value: "S/ 12,345.68" },
  { label: "Sub total", value: "S/ 148,148.14", strong: true },
  { label: "IGV (18%)", value: "S/ 26,666.67" }
];

export const resourceRows = [
  {
    resource: "Cemento Portland Tipo I",
    supplier: "Unacem",
    unit: "bol",
    cost: "32.00",
    transport: "2.50"
  },
  {
    resource: "Arena gruesa",
    supplier: "Cantera San Pedro",
    unit: "m³",
    cost: "80.00",
    transport: "15.00"
  },
  {
    resource: "Maestro de obra",
    supplier: "Mano de Obra SAC",
    unit: "jor",
    cost: "90.00",
    transport: "-"
  },
  {
    resource: "Peón",
    supplier: "Mano de Obra SAC",
    unit: "jor",
    cost: "60.00",
    transport: "-"
  },
  {
    resource: "Mezcladora 9 - 11 p³",
    supplier: "Alquileres del Sur",
    unit: "hm",
    cost: "25.00",
    transport: "5.00"
  }
];

export const apuGroups = [
  {
    group: "Materiales",
    color: "bg-emerald-500",
    rows: [
      ["Cemento Portland Tipo I", "bol", "0.25", "32.00", "8.00"],
      ["Arena gruesa", "m³", "0.020", "80.00", "1.60"],
      ["Aditivo impermeabilizante", "lt", "0.050", "18.00", "0.90"]
    ]
  },
  {
    group: "Mano de obra",
    color: "bg-blue-500",
    rows: [
      ["Maestro de obra", "jor", "0.100", "90.00", "9.00"],
      ["Peón", "jor", "0.200", "60.00", "12.00"]
    ]
  },
  {
    group: "Equipos / herramientas",
    color: "bg-amber-500",
    rows: [
      ["Mezcladora 9 - 11 p³", "hm", "0.050", "25.00", "1.25"],
      ["Herramientas manuales", "%mo", "0.050", "21.00", "1.05"]
    ]
  }
];

export const apuTabs = [
  "APU / Partida",
  "Recursos de la partida",
  "Especificaciones",
  "Análisis de precios",
  "Rendimiento",
  "Notas"
];
