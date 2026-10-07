"use client";
import { useState } from "react";

type Interval = { startTime: string; endTime: string };
type Schedule = Record<number, Interval[]>;
const days = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function ScheduleEditor({
  initial,
}: {
  initial: { weekday: number; startTime: string; endTime: string }[];
}) {
  const [schedule, setSchedule] = useState<Schedule>(() =>
    Object.fromEntries(
      days.map((_, weekday) => [
        weekday,
        initial
          .filter((row) => row.weekday === weekday)
          .map(({ startTime, endTime }) => ({ startTime, endTime })),
      ]),
    ),
  );
  function update(
    weekday: number,
    index: number,
    key: keyof Interval,
    value: string,
  ) {
    setSchedule((current) => ({
      ...current,
      [weekday]: current[weekday].map((interval, itemIndex) =>
        itemIndex === index ? { ...interval, [key]: value } : interval,
      ),
    }));
  }
  function add(weekday: number) {
    setSchedule((current) => ({
      ...current,
      [weekday]: [
        ...current[weekday],
        { startTime: "11:00", endTime: "20:00" },
      ],
    }));
  }
  function remove(weekday: number, index: number) {
    setSchedule((current) => ({
      ...current,
      [weekday]: current[weekday].filter((_, itemIndex) => itemIndex !== index),
    }));
  }
  return (
    <div className="divide-y-2 divide-black border-2 border-black">
      {days.map((day, weekday) => (
        <fieldset
          className="grid gap-4 bg-white p-4 sm:grid-cols-[130px_1fr]"
          key={day}
        >
          <legend className="sr-only">Horario de {day}</legend>
          <div>
            <p className="text-sm font-black uppercase">{day}</p>
            <span className="eyebrow opacity-45">
              {schedule[weekday].length
                ? `${schedule[weekday].length} bloque${schedule[weekday].length > 1 ? "s" : ""}`
                : "Cerrado"}
            </span>
          </div>
          <div className="grid gap-3">
            <input
              type="hidden"
              name={`day-${weekday}`}
              value={schedule[weekday]
                .map((interval) => `${interval.startTime}-${interval.endTime}`)
                .join(", ")}
            />
            {schedule[weekday].map((interval, index) => (
              <div
                className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2"
                key={`${weekday}-${index}`}
              >
                <label>
                  <span className="sr-only">Apertura</span>
                  <input
                    className="field !min-h-10 !border-black !p-2 !text-black"
                    type="time"
                    value={interval.startTime}
                    onChange={(event) =>
                      update(weekday, index, "startTime", event.target.value)
                    }
                  />
                </label>
                <span aria-hidden="true">→</span>
                <label>
                  <span className="sr-only">Cierre</span>
                  <input
                    className="field !min-h-10 !border-black !p-2 !text-black"
                    type="time"
                    value={interval.endTime}
                    onChange={(event) =>
                      update(weekday, index, "endTime", event.target.value)
                    }
                  />
                </label>
                <button
                  className="grid size-10 place-items-center border border-black font-black hover:bg-black hover:text-white"
                  type="button"
                  onClick={() => remove(weekday, index)}
                  aria-label={`Eliminar bloque de ${day}`}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              className="w-fit border-b-2 border-black text-xs font-black uppercase tracking-wider hover:bg-black hover:text-white"
              type="button"
              onClick={() => add(weekday)}
            >
              + Agregar intervalo
            </button>
          </div>
        </fieldset>
      ))}
    </div>
  );
}
