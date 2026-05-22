export interface ScheduleTaskInput {
  id: string;
  name: string;
  code?: string | null;
  durationDays: number | null;
  manualStartDate?: string | null;
  dependencyIds: string[];
}

export interface ScheduleTaskResult extends ScheduleTaskInput {
  startDate: string;
  endDate: string;
  earlyStartOffset: number;
  earlyFinishOffset: number;
  lateStartOffset: number;
  lateFinishOffset: number;
  slackDays: number;
  isCritical: boolean;
  parallelGroup: number;
}

export interface ScheduleCalculationResult {
  tasks: ScheduleTaskResult[];
  topologicalOrder: string[];
  projectStartDate: string;
  projectEndDate: string;
  projectDurationDays: number;
  criticalTaskIds: string[];
  parallelGroups: Array<{
    group: number;
    taskIds: string[];
  }>;
}

export function suggestScheduleDurationDays(
  metrado?: number | null,
  rendimiento?: number | null
): number | null {
  if (!isPositiveFinite(metrado) || !isPositiveFinite(rendimiento)) {
    return null;
  }

  return Math.max(1, Math.ceil(metrado / rendimiento));
}

export function calculateSchedule(
  tasks: ScheduleTaskInput[],
  projectStartDate: string
): ScheduleCalculationResult {
  const baseDate = parseDate(projectStartDate, "projectStartDate");
  const taskMap = new Map(tasks.map((task) => [task.id, task]));

  if (taskMap.size !== tasks.length) {
    throw new Error("El cronograma contiene tareas duplicadas.");
  }

  tasks.forEach((task) => validateTask(task, taskMap));

  const topologicalOrder = getTopologicalOrder(tasks);
  const successorsByTask = buildSuccessors(tasks);
  const earlyState = new Map<
    string,
    {
      earlyStartOffset: number;
      earlyFinishOffset: number;
    }
  >();

  topologicalOrder.forEach((taskId) => {
    const task = taskMap.get(taskId);

    if (!task || task.durationDays === null) {
      throw new Error("Todas las tareas deben tener duración antes de calcular.");
    }

    const dependencyStates = task.dependencyIds.map((dependencyId) => {
      const state = earlyState.get(dependencyId);

      if (!state) {
        throw new Error(`La dependencia ${dependencyId} no fue calculada.`);
      }

      return state;
    });
    const dependencyStartOffset =
      dependencyStates.length > 0
        ? Math.max(...dependencyStates.map((state) => state.earlyFinishOffset + 1))
        : 0;
    const manualStartOffset = task.manualStartDate
      ? daysBetween(baseDate, parseDate(task.manualStartDate, "manualStartDate"))
      : 0;

    if (manualStartOffset < 0) {
      throw new RangeError(
        `La fecha manual de ${task.name} no puede ser anterior al inicio del proyecto.`
      );
    }

    const earlyStartOffset = Math.max(0, dependencyStartOffset, manualStartOffset);
    const earlyFinishOffset = earlyStartOffset + task.durationDays - 1;

    earlyState.set(task.id, {
      earlyStartOffset,
      earlyFinishOffset
    });
  });

  const earlyFinishOffsets = Array.from(earlyState.values()).map((state) => state.earlyFinishOffset);
  const projectFinishOffset = earlyFinishOffsets.length > 0 ? Math.max(...earlyFinishOffsets) : 0;
  const lateState = new Map<
    string,
    {
      lateStartOffset: number;
      lateFinishOffset: number;
    }
  >();

  [...topologicalOrder].reverse().forEach((taskId) => {
    const task = taskMap.get(taskId);
    const successors = successorsByTask.get(taskId) || [];

    if (!task || task.durationDays === null) {
      throw new Error("Todas las tareas deben tener duración antes de calcular.");
    }

    const lateFinishOffset =
      successors.length > 0
        ? Math.min(
            ...successors.map((successorId) => {
              const successor = lateState.get(successorId);

              if (!successor) {
                throw new Error(`La sucesora ${successorId} no fue calculada.`);
              }

              return successor.lateStartOffset - 1;
            })
          )
        : projectFinishOffset;

    lateState.set(taskId, {
      lateFinishOffset,
      lateStartOffset: lateFinishOffset - task.durationDays + 1
    });
  });

  const resultsWithoutGroups = topologicalOrder.map((taskId) => {
    const task = taskMap.get(taskId);
    const early = earlyState.get(taskId);
    const late = lateState.get(taskId);

    if (!task || !early || !late) {
      throw new Error(`No se pudo calcular la tarea ${taskId}.`);
    }

    const slackDays = late.lateStartOffset - early.earlyStartOffset;

    return {
      ...task,
      startDate: addDays(baseDate, early.earlyStartOffset),
      endDate: addDays(baseDate, early.earlyFinishOffset),
      earlyStartOffset: early.earlyStartOffset,
      earlyFinishOffset: early.earlyFinishOffset,
      lateStartOffset: late.lateStartOffset,
      lateFinishOffset: late.lateFinishOffset,
      slackDays,
      isCritical: slackDays === 0,
      parallelGroup: 0
    };
  });
  const parallelGroupByTaskId = assignParallelGroups(resultsWithoutGroups);
  const results = resultsWithoutGroups.map((task) => ({
    ...task,
    parallelGroup: parallelGroupByTaskId.get(task.id) ?? 0
  }));
  const parallelGroups = Array.from(
    results.reduce((groups, task) => {
      const current = groups.get(task.parallelGroup) || [];
      groups.set(task.parallelGroup, [...current, task.id]);

      return groups;
    }, new Map<number, string[]>())
  )
    .map(([group, taskIds]) => ({ group, taskIds }))
    .filter((group) => group.taskIds.length > 1);

  return {
    tasks: results,
    topologicalOrder,
    projectStartDate,
    projectEndDate: addDays(baseDate, projectFinishOffset),
    projectDurationDays: projectFinishOffset + 1,
    criticalTaskIds: results.filter((task) => task.isCritical).map((task) => task.id),
    parallelGroups
  };
}

function assignParallelGroups(tasks: ScheduleTaskResult[]) {
  const groups: ScheduleTaskResult[][] = [];
  const groupByTaskId = new Map<string, number>();

  tasks
    .slice()
    .sort((first, second) => first.earlyStartOffset - second.earlyStartOffset)
    .forEach((task) => {
      const overlappingGroupIndex = groups.findIndex((group) =>
        group.some((groupTask) => intervalsOverlap(task, groupTask))
      );
      const groupIndex = overlappingGroupIndex >= 0 ? overlappingGroupIndex : groups.length;

      groups[groupIndex] = [...(groups[groupIndex] || []), task];
      groupByTaskId.set(task.id, groupIndex);
    });

  return groupByTaskId;
}

function intervalsOverlap(
  first: Pick<ScheduleTaskResult, "earlyFinishOffset" | "earlyStartOffset">,
  second: Pick<ScheduleTaskResult, "earlyFinishOffset" | "earlyStartOffset">
) {
  return (
    first.earlyStartOffset <= second.earlyFinishOffset &&
    second.earlyStartOffset <= first.earlyFinishOffset
  );
}

function getTopologicalOrder(tasks: ScheduleTaskInput[]): string[] {
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const order: string[] = [];

  function visit(taskId: string, path: string[]) {
    if (visited.has(taskId)) {
      return;
    }

    if (visiting.has(taskId)) {
      throw new Error(`El cronograma tiene un ciclo: ${[...path, taskId].join(" -> ")}.`);
    }

    const task = taskMap.get(taskId);

    if (!task) {
      throw new Error(`La tarea ${taskId} no existe.`);
    }

    visiting.add(taskId);
    task.dependencyIds.forEach((dependencyId) => visit(dependencyId, [...path, taskId]));
    visiting.delete(taskId);
    visited.add(taskId);
    order.push(taskId);
  }

  tasks.forEach((task) => visit(task.id, []));

  return order;
}

function buildSuccessors(tasks: ScheduleTaskInput[]) {
  return tasks.reduce((successors, task) => {
    if (!successors.has(task.id)) {
      successors.set(task.id, []);
    }

    task.dependencyIds.forEach((dependencyId) => {
      const current = successors.get(dependencyId) || [];
      successors.set(dependencyId, [...current, task.id]);
    });

    return successors;
  }, new Map<string, string[]>());
}

function validateTask(task: ScheduleTaskInput, taskMap: Map<string, ScheduleTaskInput>) {
  if (!task.id.trim()) {
    throw new Error("Todas las tareas deben tener ID.");
  }

  if (task.durationDays === null || !Number.isFinite(task.durationDays) || task.durationDays <= 0) {
    throw new RangeError(`La tarea ${task.name} debe tener una duración mayor que 0.`);
  }

  const uniqueDependencies = new Set(task.dependencyIds);

  if (uniqueDependencies.size !== task.dependencyIds.length) {
    throw new Error(`La tarea ${task.name} tiene dependencias duplicadas.`);
  }

  task.dependencyIds.forEach((dependencyId) => {
    if (dependencyId === task.id) {
      throw new Error(`La tarea ${task.name} no puede depender de sí misma.`);
    }

    if (!taskMap.has(dependencyId)) {
      throw new Error(`La dependencia ${dependencyId} de ${task.name} no existe.`);
    }
  });
}

function parseDate(value: string, fieldName: string): Date {
  const date = new Date(`${value}T00:00:00`);

  if (!value || Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} debe ser una fecha válida.`);
  }

  return date;
}

function addDays(date: Date, days: number): string {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + Math.ceil(days));

  return nextDate.toISOString().slice(0, 10);
}

function daysBetween(start: Date, end: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay);
}

function isPositiveFinite(value?: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
