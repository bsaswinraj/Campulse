"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  return (
    <div className="max-w-7xl mx-auto mt-10 px-6">

      {/* Month Header */}

      <div className="flex items-center justify-between mb-8">

        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="px-4 py-2 rounded-lg bg-white shadow hover:bg-blue-50 transition"
        >
          ←
        </button>

        <h2 className="text-3xl font-bold text-blue-700">
          {format(currentMonth, "MMMM yyyy")}
        </h2>

        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="px-4 py-2 rounded-lg bg-white shadow hover:bg-blue-50 transition"
        >
          →
        </button>

      </div>

      {/* Week Days */}

      <div className="grid grid-cols-7 gap-4 mb-4">

        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}

      </div>

      {/* Calendar Grid */}

      <div className="grid grid-cols-7 gap-4">

        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`min-h-[140px] rounded-2xl border bg-white shadow-sm p-3 transition hover:shadow-md ${
              !isSameMonth(day, currentMonth)
                ? "opacity-30"
                : ""
            }`}
          >
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full font-semibold ${
                isToday(day)
                  ? "bg-blue-600 text-white"
                  : "text-gray-700"
              }`}
            >
              {format(day, "d")}
            </div>

            {/* Event Placeholder */}

            <div className="mt-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 h-20 flex items-center justify-center text-xs text-blue-500">
              No Event
            </div>

          </div>
        ))}

      </div>

    </div>
  );
}