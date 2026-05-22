import { describe, expect, it } from "vitest";
import { calculateSchedule, suggestScheduleDurationDays } from "./schedule";

describe("calculos de cronograma", () => {
  it("sugiere duracion desde metrado y rendimiento usables", () => {
    expect(suggestScheduleDurationDays(42, 8)).toBe(6);
    expect(suggestScheduleDurationDays(0, 8)).toBeNull();
    expect(suggestScheduleDurationDays(42, null)).toBeNull();
  });

  it("calcula orden, fechas y ruta critica con dependencias fin-a-inicio", () => {
    const schedule = calculateSchedule(
      [
        {
          id: "cimentacion",
          name: "Cimentacion",
          durationDays: 3,
          dependencyIds: []
        },
        {
          id: "muros",
          name: "Muros",
          durationDays: 4,
          dependencyIds: ["cimentacion"]
        },
        {
          id: "acabados",
          name: "Acabados",
          durationDays: 2,
          dependencyIds: ["muros"]
        }
      ],
      "2026-05-18"
    );

    expect(schedule.topologicalOrder).toEqual(["cimentacion", "muros", "acabados"]);
    expect(schedule.projectEndDate).toBe("2026-05-26");
    expect(schedule.projectDurationDays).toBe(9);
    expect(schedule.tasks.map((task) => [task.id, task.startDate, task.endDate])).toEqual([
      ["cimentacion", "2026-05-18", "2026-05-20"],
      ["muros", "2026-05-21", "2026-05-24"],
      ["acabados", "2026-05-25", "2026-05-26"]
    ]);
    expect(schedule.criticalTaskIds).toEqual(["cimentacion", "muros", "acabados"]);
  });

  it("identifica tareas paralelas y holgura fuera de la ruta critica", () => {
    const schedule = calculateSchedule(
      [
        {
          id: "obra-gruesa",
          name: "Obra gruesa",
          durationDays: 5,
          dependencyIds: []
        },
        {
          id: "instalaciones",
          name: "Instalaciones",
          durationDays: 2,
          dependencyIds: []
        },
        {
          id: "entrega",
          name: "Entrega",
          durationDays: 1,
          dependencyIds: ["obra-gruesa", "instalaciones"]
        }
      ],
      "2026-05-18"
    );

    expect(schedule.parallelGroups).toEqual([
      {
        group: 0,
        taskIds: ["obra-gruesa", "instalaciones"]
      }
    ]);
    expect(schedule.tasks.find((task) => task.id === "instalaciones")?.slackDays).toBe(3);
    expect(schedule.criticalTaskIds).toEqual(["obra-gruesa", "entrega"]);
  });

  it("agrupa paralelos por solapamiento real aunque tengan distinta profundidad", () => {
    const schedule = calculateSchedule(
      [
        {
          id: "larga",
          name: "Larga",
          durationDays: 5,
          dependencyIds: []
        },
        {
          id: "base",
          name: "Base",
          durationDays: 1,
          dependencyIds: []
        },
        {
          id: "derivada",
          name: "Derivada",
          durationDays: 2,
          dependencyIds: ["base"]
        }
      ],
      "2026-05-18"
    );

    expect(schedule.parallelGroups).toContainEqual({
      group: 0,
      taskIds: ["larga", "base", "derivada"]
    });
  });

  it("permite duraciones fraccionarias positivas", () => {
    const schedule = calculateSchedule(
      [
        {
          id: "medio-dia",
          name: "Medio dia",
          durationDays: 0.5,
          dependencyIds: []
        }
      ],
      "2026-05-18"
    );

    expect(schedule.projectDurationDays).toBe(0.5);
  });

  it("respeta fecha manual posterior a las dependencias", () => {
    const schedule = calculateSchedule(
      [
        {
          id: "base",
          name: "Base",
          durationDays: 2,
          dependencyIds: []
        },
        {
          id: "curado",
          name: "Curado",
          durationDays: 2,
          manualStartDate: "2026-05-25",
          dependencyIds: ["base"]
        }
      ],
      "2026-05-18"
    );

    expect(schedule.tasks.find((task) => task.id === "curado")?.startDate).toBe("2026-05-25");
  });

  it("rechaza fecha manual anterior al inicio del proyecto", () => {
    expect(() =>
      calculateSchedule(
        [
          {
            id: "preparacion",
            name: "Preparacion",
            durationDays: 1,
            manualStartDate: "2026-05-17",
            dependencyIds: []
          }
        ],
        "2026-05-18"
      )
    ).toThrow(RangeError);
  });

  it("detecta duraciones faltantes, dependencias invalidas y ciclos", () => {
    expect(() =>
      calculateSchedule(
        [
          {
            id: "sin-duracion",
            name: "Sin duracion",
            durationDays: null,
            dependencyIds: []
          }
        ],
        "2026-05-18"
      )
    ).toThrow(RangeError);

    expect(() =>
      calculateSchedule(
        [
          {
            id: "a",
            name: "A",
            durationDays: 1,
            dependencyIds: ["z"]
          }
        ],
        "2026-05-18"
      )
    ).toThrow("no existe");

    expect(() =>
      calculateSchedule(
        [
          {
            id: "a",
            name: "A",
            durationDays: 1,
            dependencyIds: ["b"]
          },
          {
            id: "b",
            name: "B",
            durationDays: 1,
            dependencyIds: ["a"]
          }
        ],
        "2026-05-18"
      )
    ).toThrow("ciclo");
  });
});
