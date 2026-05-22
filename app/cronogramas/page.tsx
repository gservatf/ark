"use client";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GitBranch,
  Milestone,
  Network,
  RefreshCcw,
  Route,
  Rows3
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/shared/Button";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import {
  calculateSchedule,
  suggestScheduleDurationDays,
  type ScheduleCalculationResult,
  type ScheduleTaskInput
} from "@/lib/calculations/schedule";
import { getInitialBudgetLines, mockBudgets } from "@/lib/mock-data/budgets";
import { cn } from "@/lib/utils";
import type { PresupuestoPartida } from "@/types/domain";

type ScheduleTaskForm = {
  id: string;
  budgetLineId: string;
  code: string;
  name: string;
  unit: string;
  metrado: number;
  rendimiento: number | null;
  suggestedDurationDays: number | null;
  manualDurationDays: number | null;
  manualStartDate: string;
  dependencyIds: string[];
  order: number;
};

const today = () => new Date().toISOString().slice(0, 10);

export default function CronogramasPage() {
  const [activeBudgetId, setActiveBudgetId] = useState(mockBudgets[0]?.id || "");
  const [projectStartDate, setProjectStartDate] = useState(today());
  const [tasksByBudget, setTasksByBudget] = useState<Record<string, ScheduleTaskForm[]>>(() =>
    Object.fromEntries(mockBudgets.map((budget) => [budget.id, createTasksFromBudget(budget.id)]))
  );

  const activeBudget = useMemo(
    () => mockBudgets.find((budget) => budget.id === activeBudgetId) || mockBudgets[0],
    [activeBudgetId]
  );
  const activeTasks = useMemo(
    () => (activeBudget ? tasksByBudget[activeBudget.id] || [] : []),
    [activeBudget, tasksByBudget]
  );
  const missingDurationTasks = useMemo(
    () => activeTasks.filter((task) => getEffectiveDuration(task) === null),
    [activeTasks]
  );
  const calculation = useMemo(() => {
    if (missingDurationTasks.length > 0 || activeTasks.length === 0) {
      return {
        error: missingDurationTasks.length > 0
          ? "Completa la duracion manual de las partidas sin rendimiento usable."
          : "",
        schedule: null
      };
    }

    try {
      return {
        error: "",
        schedule: calculateSchedule(
          activeTasks.map(toScheduleInput),
          projectStartDate
        )
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "No se pudo calcular el cronograma.",
        schedule: null
      };
    }
  }, [activeTasks, missingDurationTasks.length, projectStartDate]);
  const schedule = calculation.schedule;
  const calculatedTasks = useMemo(() => schedule?.tasks || [], [schedule]);
  const taskResultById = useMemo(
    () => new Map(calculatedTasks.map((task) => [task.id, task])),
    [calculatedTasks]
  );
  const missingDurationIds = useMemo(
    () => new Set(missingDurationTasks.map((task) => task.id)),
    [missingDurationTasks]
  );
  const criticalCount = useMemo(
    () => calculatedTasks.filter((task) => task.isCritical).length,
    [calculatedTasks]
  );
  const parallelTaskCount = useMemo(
    () => schedule
      ? new Set(schedule.parallelGroups.flatMap((group) => group.taskIds)).size
      : 0,
    [schedule]
  );

  const updateTasks = useCallback((nextTasks: ScheduleTaskForm[]) => {
    if (!activeBudget) {
      return;
    }

    setTasksByBudget((current) => ({
      ...current,
      [activeBudget.id]: nextTasks
    }));
  }, [activeBudget]);

  const updateTask = useCallback((taskId: string, patch: Partial<ScheduleTaskForm>) => {
    updateTasks(activeTasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
  }, [activeTasks, updateTasks]);

  const resetTasks = useCallback(() => {
    if (!activeBudget) {
      return;
    }

    setTasksByBudget((current) => ({
      ...current,
      [activeBudget.id]: createTasksFromBudget(activeBudget.id)
    }));
  }, [activeBudget]);

  if (!activeBudget) {
    return null;
  }

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-5 py-6 lg:px-8">
        <PageHeader
          actions={
            <>
              <Button icon={RefreshCcw} onClick={resetTasks} variant="secondary">
                Regenerar tareas
              </Button>
              <Button icon={CheckCircle2} disabled title="Persistencia pendiente">
                Guardar cronograma
              </Button>
            </>
          }
          backLink={{ href: "/presupuestos", label: "Volver a presupuestos" }}
          breadcrumbs={[{ label: "Planificacion" }, { label: "Cronogramas mock" }]}
          description="Genera un cronograma preliminar desde partidas presupuestadas, edita duraciones y dependencias, y revisa Gantt, paralelos y ruta critica."
          title="Cronogramas"
        />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Presupuesto fuente</span>
                <select
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  onChange={(event) => setActiveBudgetId(event.target.value)}
                  value={activeBudget.id}
                >
                  {mockBudgets.map((budget) => (
                    <option key={budget.id} value={budget.id}>
                      {budget.proyecto_nombre} - {budget.version}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Inicio base</span>
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  onChange={(event) => setProjectStartDate(event.target.value)}
                  type="date"
                  value={projectStartDate}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-soft">
            <p className="text-xs font-bold uppercase text-brand-600">Mock sin persistencia</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Las tareas nacen de partidas snapshot del presupuesto activo y se reinician al recargar.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Rows3}
            label="Tareas"
            link="Desde partidas"
            tone="sky"
            value={String(activeTasks.length)}
          />
          <StatCard
            icon={Clock3}
            label="Duracion total"
            link={schedule ? `${schedule.projectStartDate} a ${schedule.projectEndDate}` : "Pendiente"}
            tone="amber"
            value={schedule ? `${schedule.projectDurationDays} dias` : "-"}
          />
          <StatCard
            icon={Route}
            label="Ruta critica"
            link="Holgura cero"
            tone="violet"
            value={schedule ? String(criticalCount) : "-"}
          />
          <StatCard
            icon={Network}
            label="Paralelas"
            link="Mismo nivel"
            tone="green"
            value={schedule ? String(parallelTaskCount) : "-"}
          />
        </section>

        {calculation.error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Cronograma pendiente de resolver</p>
              <p className="mt-1 leading-6">{calculation.error}</p>
            </div>
          </div>
        ) : null}

        <section className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-5">
            <ScheduleTasksTable
              missingDurationIds={missingDurationIds}
              onTaskChange={updateTask}
              resultsByTaskId={taskResultById}
              tasks={activeTasks}
            />
            <GanttView schedule={schedule} tasks={activeTasks} />
          </div>

          <aside className="grid min-w-0 gap-5 xl:grid-cols-2 2xl:flex 2xl:flex-col">
            <RecommendedOrder schedule={schedule} tasks={activeTasks} />
            <ParallelTasks schedule={schedule} tasks={activeTasks} />
          </aside>
        </section>
      </div>
    </AppLayout>
  );
}

function ScheduleTasksTable({
  missingDurationIds,
  onTaskChange,
  resultsByTaskId,
  tasks
}: {
  missingDurationIds: Set<string>;
  onTaskChange: (taskId: string, patch: Partial<ScheduleTaskForm>) => void;
  resultsByTaskId: Map<string, ScheduleCalculationResult["tasks"][number]>;
  tasks: ScheduleTaskForm[];
}) {
  const dependencyOptionsByTaskId = useMemo(
    () =>
      new Map(
        tasks.map((task) => [
          task.id,
          tasks
            .filter((option) => option.id !== task.id)
            .map((option) => ({
              id: option.id,
              label: `${option.code} - ${option.name}`
            }))
        ])
      ),
    [tasks]
  );

  return (
    <DataTable
      description="Edita duracion, fecha minima de inicio y dependencias fin-a-inicio."
      emptyState={
        <EmptyState
          description="El presupuesto activo no tiene partidas presupuestadas para generar tareas."
          icon={CalendarDays}
          title="Sin tareas de cronograma"
        />
      }
      isEmpty={tasks.length === 0}
      minWidth={1180}
      title="Tareas del cronograma"
    >
      <thead>
        <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
          <th scope="col" className="px-4 py-3">Partida</th>
          <th scope="col" className="px-4 py-3 text-right">Metrado</th>
          <th scope="col" className="px-4 py-3 text-right">Rendimiento</th>
          <th scope="col" className="px-4 py-3">Duracion</th>
          <th scope="col" className="px-4 py-3">Inicio minimo</th>
          <th scope="col" className="px-4 py-3">Dependencias</th>
          <th scope="col" className="px-4 py-3">Resultado</th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <ScheduleTaskRow
            dependencyOptions={dependencyOptionsByTaskId.get(task.id) || []}
            isMissingDuration={missingDurationIds.has(task.id)}
            key={task.id}
            onTaskChange={onTaskChange}
            result={resultsByTaskId.get(task.id)}
            task={task}
          />
        ))}
      </tbody>
    </DataTable>
  );
}

const ScheduleTaskRow = memo(function ScheduleTaskRow({
  dependencyOptions,
  isMissingDuration,
  onTaskChange,
  result,
  task
}: {
  dependencyOptions: { id: string; label: string }[];
  isMissingDuration: boolean;
  onTaskChange: (taskId: string, patch: Partial<ScheduleTaskForm>) => void;
  result?: ScheduleCalculationResult["tasks"][number];
  task: ScheduleTaskForm;
}) {
  const handleDurationChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onTaskChange(task.id, {
        manualDurationDays: parsePositiveInteger(event.target.value)
      });
    },
    [onTaskChange, task.id]
  );
  const handleStartDateChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onTaskChange(task.id, { manualStartDate: event.target.value });
    },
    [onTaskChange, task.id]
  );
  const handleDependencyChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onTaskChange(task.id, {
        dependencyIds: Array.from(event.target.selectedOptions).map((option) => option.value)
      });
    },
    [onTaskChange, task.id]
  );

  return (
    <tr
      className={cn(
        "border-b border-slate-100 align-top last:border-b-0",
        result?.isCritical && "bg-red-50/45"
      )}
    >
      <td className="px-4 py-4">
        <p className="font-bold text-slate-900">{task.code}</p>
        <p className="mt-1 max-w-[260px] text-sm font-medium text-slate-700">{task.name}</p>
        <p className="mt-1 text-xs text-slate-500">Orden presupuesto: {task.order}</p>
      </td>
      <td className="px-4 py-4 text-right font-semibold text-slate-700">
        {formatNumber(task.metrado)} {task.unit}
      </td>
      <td className="px-4 py-4 text-right text-sm text-slate-600">
        {task.rendimiento ? `${formatNumber(task.rendimiento)} / dia` : "Sin dato"}
      </td>
      <td className="px-4 py-4">
        <div className="w-[150px]">
          <input
            className={cn(
              "h-10 w-full rounded-xl border bg-white px-3 text-sm font-semibold outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100",
              isMissingDuration ? "border-amber-300" : "border-slate-200"
            )}
            min="1"
            onChange={handleDurationChange}
            placeholder={task.suggestedDurationDays ? String(task.suggestedDurationDays) : "Manual"}
            type="number"
            value={task.manualDurationDays ?? ""}
          />
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {task.suggestedDurationDays
              ? `Sugerida: ${task.suggestedDurationDays} dias`
              : "Duracion manual obligatoria"}
          </p>
        </div>
      </td>
      <td className="px-4 py-4">
        <input
          className="h-10 w-[150px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          onChange={handleStartDateChange}
          type="date"
          value={task.manualStartDate}
        />
      </td>
      <td className="px-4 py-4">
        <select
          className="min-h-24 w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
          multiple
          onChange={handleDependencyChange}
          value={task.dependencyIds}
        >
          {dependencyOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-4">
        {result ? (
          <div className="min-w-[180px] text-sm">
            <p className="font-bold text-slate-900">
              {result.startDate} al {result.endDate}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Holgura: {result.slackDays} dias
            </p>
            <span
              className={cn(
                "mt-2 inline-flex rounded-lg px-2 py-1 text-xs font-bold",
                result.isCritical
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-100 text-emerald-700"
              )}
            >
              {result.isCritical ? "Ruta critica" : "Con holgura"}
            </span>
          </div>
        ) : (
          <span className="text-sm font-semibold text-slate-500">Pendiente</span>
        )}
      </td>
    </tr>
  );
});

function GanttView({
  schedule,
  tasks
}: {
  schedule: ScheduleCalculationResult | null;
  tasks: ScheduleTaskForm[];
}) {
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);

  if (!schedule) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
        <EmptyState
          description="Resuelve duraciones y dependencias para mostrar barras, solapes y ruta critica."
          icon={Milestone}
          title="Gantt pendiente"
        />
      </section>
    );
  }

  const totalDays = Math.max(schedule.projectDurationDays, 1);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Gantt simple</h2>
          <p className="mt-1 text-sm text-slate-500">
            {schedule.projectStartDate} a {schedule.projectEndDate} · {schedule.projectDurationDays} dias
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-lg bg-red-100 px-2 py-1 text-red-700">Ruta critica</span>
          <span className="rounded-lg bg-blue-100 px-2 py-1 text-brand-600">Tarea con holgura</span>
        </div>
      </div>

      <div className="overflow-x-auto p-5">
        <div className="min-w-[820px] space-y-3">
          {schedule.tasks.map((task) => {
            const sourceTask = taskById.get(task.id);
            const left = (task.earlyStartOffset / totalDays) * 100;
            const width = ((task.earlyFinishOffset - task.earlyStartOffset + 1) / totalDays) * 100;

            return (
              <div className="grid grid-cols-[240px_minmax(0,1fr)] items-center gap-4" key={task.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {sourceTask?.code} · {task.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {task.startDate} - {task.endDate}
                  </p>
                </div>
                <div className="relative h-9 rounded-xl bg-slate-100">
                  <div
                    className={cn(
                      "absolute top-1 h-7 rounded-lg px-3 text-left text-xs font-bold leading-7 text-white shadow-sm",
                      task.isCritical ? "bg-red-500" : "bg-brand-600"
                    )}
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 4)}%`
                    }}
                    title={`${task.name}: ${task.startDate} al ${task.endDate}`}
                  >
                    <span className="block truncate">{task.durationDays} d</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RecommendedOrder({
  schedule,
  tasks
}: {
  schedule: ScheduleCalculationResult | null;
  tasks: ScheduleTaskForm[];
}) {
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const resultById = useMemo(
    () => new Map(schedule?.tasks.map((task) => [task.id, task]) || []),
    [schedule]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-600">
          <GitBranch className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold text-slate-950">Orden recomendado</h2>
          <p className="text-sm text-slate-500">Resultado topologico</p>
        </div>
      </div>

      {schedule ? (
        <ol className="mt-5 space-y-3">
          {schedule.topologicalOrder.map((taskId, index) => {
            const task = taskById.get(taskId);
            const result = resultById.get(taskId);

            return (
              <li className="flex gap-3" key={taskId}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{task?.name}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {result?.startDate} · grupo {result?.parallelGroup}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-500">
            El orden se mostrará cuando el cronograma sea válido.
        </p>
      )}
    </section>
  );
}

function ParallelTasks({
  schedule,
  tasks
}: {
  schedule: ScheduleCalculationResult | null;
  tasks: ScheduleTaskForm[];
}) {
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Network className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold text-slate-950">Tareas paralelas</h2>
          <p className="text-sm text-slate-500">Frentes sin dependencia directa</p>
        </div>
      </div>

      {schedule && schedule.parallelGroups.length > 0 ? (
        <div className="mt-5 space-y-4">
          {schedule.parallelGroups.map((group) => (
            <div className="rounded-xl bg-slate-50 p-4" key={group.group}>
              <p className="text-xs font-bold uppercase text-slate-500">Grupo {group.group + 1}</p>
              <ul className="mt-2 space-y-2">
                {group.taskIds.map((taskId) => (
                  <li className="text-sm font-semibold text-slate-800" key={taskId}>
                    {taskById.get(taskId)?.code} · {taskById.get(taskId)?.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-500">
          No hay grupos paralelos detectados o el cronograma aún no es válido.
        </p>
      )}
    </section>
  );
}

function createTasksFromBudget(budgetId: string): ScheduleTaskForm[] {
  return getInitialBudgetLines(budgetId)
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((line) => createTaskFromLine(line));
}

function createTaskFromLine(line: PresupuestoPartida): ScheduleTaskForm {
  const suggestedDurationDays = suggestScheduleDurationDays(
    line.metrado,
    line.rendimiento_snapshot
  );

  return {
    id: `task-${line.id}`,
    budgetLineId: line.id,
    code: line.codigo_snapshot,
    name: line.nombre_snapshot,
    unit: line.unidad_snapshot,
    metrado: line.metrado,
    rendimiento: line.rendimiento_snapshot ?? null,
    suggestedDurationDays,
    manualDurationDays: null,
    manualStartDate: "",
    dependencyIds: [],
    order: line.orden
  };
}

function toScheduleInput(task: ScheduleTaskForm): ScheduleTaskInput {
  return {
    id: task.id,
    name: task.name,
    code: task.code,
    durationDays: getEffectiveDuration(task),
    manualStartDate: task.manualStartDate || null,
    dependencyIds: task.dependencyIds
  };
}

function getEffectiveDuration(task: ScheduleTaskForm): number | null {
  return task.manualDurationDays || task.suggestedDurationDays;
}

function parsePositiveInteger(value: string): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.ceil(parsed);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(value);
}
