import {
  Download,
  Filter,
  ListFilter,
  MoreVertical,
  Plus,
  Settings2,
  SlidersHorizontal,
  Trash2
} from "lucide-react";
import { memo, useCallback, useMemo, type ChangeEvent, type MouseEvent } from "react";
import { Button } from "@/components/shared/Button";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatNumber } from "@/components/presupuestos/budget-ui";
import type { Partida, Presupuesto, PresupuestoBorradorPartida, PresupuestoPartida } from "@/types/domain";

type BudgetTableProps = {
  availablePartidas: Partida[];
  budget: Presupuesto;
  draftLines?: PresupuestoBorradorPartida[];
  lines: PresupuestoPartida[];
  selectedPartidaId: string;
  onAddPartida: () => void;
  onMetradoChange: (lineId: string, value: string) => void;
  onPartidaSelect: (partidaId: string) => void;
  onRemoveLine: (lineId: string) => void;
  onSelectLine: (lineId: string) => void;
  onToggleLinePriceLock?: (lineId: string, checked: boolean) => void;
  selectedLineId?: string;
};

type BudgetRowProps = {
  draftLine?: PresupuestoBorradorPartida;
  isSelected: boolean;
  onMetradoChange: (lineId: string, value: string) => void;
  onRemoveLine: (lineId: string) => void;
  onSelectLine: (lineId: string) => void;
  onToggleLinePriceLock?: (lineId: string, checked: boolean) => void;
  row: PresupuestoPartida;
};

const BudgetRow = memo(function BudgetRow({
  draftLine,
  isSelected,
  onMetradoChange,
  onRemoveLine,
  onSelectLine,
  onToggleLinePriceLock,
  row
}: BudgetRowProps) {
  const handleSelectLine = useCallback(() => {
    onSelectLine(row.id);
  }, [onSelectLine, row.id]);

  const stopInputPropagation = useCallback((event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  }, []);

  const handleMetradoChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onMetradoChange(row.id, event.target.value);
    },
    [onMetradoChange, row.id]
  );

  const handlePriceLockChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.stopPropagation();
      onToggleLinePriceLock?.(row.id, event.target.checked);
    },
    [onToggleLinePriceLock, row.id]
  );

  const handleRemoveLine = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onRemoveLine(row.id);
    },
    [onRemoveLine, row.id]
  );

  return (
    <tr
      className={`cursor-pointer border-b border-slate-100 transition hover:bg-blue-50/50 ${
        isSelected ? "bg-blue-50/70" : ""
      }`}
      onClick={handleSelectLine}
    >
      <td className="px-5 py-3 text-center text-slate-400">
        <span className="inline-flex h-5 w-5 items-center justify-center">
          <MoreVertical className="h-4 w-4" />
        </span>
      </td>
      <td className="px-5 py-3">
        <button className="flex min-w-0 items-start gap-4 text-left" onClick={handleSelectLine} type="button">
          <span className="w-20 shrink-0 font-semibold text-slate-700">{row.codigo_snapshot}</span>
          <span className="min-w-0">
            <span className="block max-w-[360px] truncate font-medium text-slate-800">{row.nombre_snapshot}</span>
            <span className="mt-1 block text-xs text-slate-500">
              Snapshot: {row.categoria_snapshot || "Sin categoría"}
            </span>
          </span>
        </button>
      </td>
      <td className="px-5 py-3 text-center font-medium text-slate-600">{row.unidad_snapshot}</td>
      <td className="px-5 py-3 text-right">
        <input
          aria-label={`Metrado de ${row.nombre_snapshot}`}
          className="h-9 w-28 rounded-lg border border-slate-200 bg-white px-3 text-right text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          min="0"
          onChange={handleMetradoChange}
          onClick={stopInputPropagation}
          step="0.01"
          type="number"
          value={String(row.metrado)}
        />
      </td>
      <td className="px-5 py-3 text-center">
        {draftLine ? (
          <label className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600">
            <input
              checked={draftLine.precio_fijado}
              className="h-4 w-4"
              onChange={handlePriceLockChange}
              onClick={stopInputPropagation}
              type="checkbox"
            />
            {draftLine.precio_fijado ? "Fijado" : "Auto"}
          </label>
        ) : null}
      </td>
      <td className="px-5 py-3 text-right font-medium text-slate-700">
        {formatNumber(row.precio_unitario_snapshot)}
      </td>
      <td className="px-5 py-3 text-right font-semibold text-slate-800">
        {formatNumber(row.parcial)}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          aria-label={`Eliminar ${row.nombre_snapshot}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          onClick={handleRemoveLine}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
});

export function BudgetTable({
  availablePartidas,
  budget,
  draftLines = [],
  lines,
  onAddPartida,
  onMetradoChange,
  onPartidaSelect,
  onRemoveLine,
  onSelectLine,
  onToggleLinePriceLock,
  selectedLineId,
  selectedPartidaId
}: BudgetTableProps) {
  const totalMetrado = useMemo(
    () => lines.reduce((total, line) => total + line.metrado, 0),
    [lines]
  );
  const draftLineById = useMemo(
    () => new Map(draftLines.map((line) => [line.id, line])),
    [draftLines]
  );
  const partidaOptions = useMemo(
    () =>
      availablePartidas.map((partida) => ({
        id: partida.id,
        label: `${partida.codigo} - ${partida.nombre}`
      })),
    [availablePartidas]
  );
  const handlePartidaSelect = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => onPartidaSelect(event.target.value),
    [onPartidaSelect]
  );

  return (
    <DataTable
      actions={
        <>
          <Button className="h-9 px-3" disabled icon={Download} title="Importación pendiente" variant="secondary">
            Importar
          </Button>
          <TableIconButton icon={ListFilter} label="Agrupar pendiente" />
          <TableIconButton icon={SlidersHorizontal} label="Vista pendiente" />
          <TableIconButton icon={Filter} label="Filtros pendientes" />
          <TableIconButton icon={Settings2} label="Configuración pendiente" />
        </>
      }
      emptyState={
        <EmptyState
          description="Selecciona una partida existente para empezar a construir el presupuesto."
          title="Este presupuesto todavía no tiene partidas"
        />
      }
      footer={
        <footer className="flex flex-col gap-4 px-4 py-4 text-sm sm:px-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <select
              aria-label="Seleccionar partida existente"
              className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 sm:min-w-[240px] md:max-w-[420px]"
              onChange={handlePartidaSelect}
              value={selectedPartidaId}
            >
              <option value="">Seleccionar partida existente</option>
              {partidaOptions.map((partida) => (
                <option key={partida.id} value={partida.id}>
                  {partida.label}
                </option>
              ))}
            </select>
            <Button
              className="h-10 px-4"
              disabled={!selectedPartidaId || availablePartidas.length === 0}
              icon={Plus}
              onClick={onAddPartida}
              variant="secondary"
            >
              Agregar partida
            </Button>
            {availablePartidas.length === 0 ? (
              <span className="text-xs font-semibold text-slate-500">Todas las partidas activas ya fueron agregadas.</span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 xl:justify-end">
            <span className="text-slate-500">
              Total partidas: <strong className="text-slate-700">{lines.length}</strong>
            </span>
            <span className="text-slate-500">
              Metrado total: <strong className="text-slate-700">{formatNumber(totalMetrado)}</strong>
            </span>
            <span className="font-bold text-slate-900">Subtotal partidas: {formatCurrency(budget.subtotal)}</span>
          </div>
        </footer>
      }
      isEmpty={lines.length === 0}
      minWidth={900}
      title={`Presupuesto de obra · ${budget.version}`}
    >
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <th scope="col" className="w-16 px-5 py-3 text-center">#</th>
              <th scope="col" className="px-5 py-3">Partida</th>
              <th scope="col" className="px-5 py-3 text-center">Unidad</th>
              <th scope="col" className="px-5 py-3 text-right">Metrado</th>
              <th scope="col" className="px-5 py-3 text-center">Precio</th>
              <th scope="col" className="px-5 py-3 text-right">P.U. (S/)</th>
              <th scope="col" className="px-5 py-3 text-right">Parcial (S/)</th>
              <th scope="col" aria-label="Acciones" className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {lines.map((row) => (
              <BudgetRow
                draftLine={draftLineById.get(row.id)}
                isSelected={selectedLineId === row.id}
                key={row.id}
                onMetradoChange={onMetradoChange}
                onRemoveLine={onRemoveLine}
                onSelectLine={onSelectLine}
                onToggleLinePriceLock={onToggleLinePriceLock}
                row={row}
              />
            ))}
          </tbody>
    </DataTable>
  );
}

function TableIconButton({
  icon: Icon,
  label
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      className="flex h-9 w-10 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400"
      disabled
      title={label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
