"use client";

import { useEffect, useState } from "react";
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

import { supabase } from "@/lib/supabase";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Event = {
  id: string;
  event_name: string;
  description: string;
  venue: string;
  resource_person: string | null;
  event_date: string;
  event_time: string;
  registration_link: string | null;
  poster_url: string | null;
  coordinators: string | null;
};

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // =========================
  // LOAD EVENTS
  // =========================

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);

      const { data, error } = await supabase
        .from("events")
        .select(
          `
          id,
          event_name,
          description,
          venue,
          resource_person,
          event_date,
          event_time,
          registration_link,
          poster_url,
          coordinators
          `
        )
        .order("event_date", {
          ascending: true,
        });

      if (error) {
        console.error("Error loading events:", error);
        setEvents([]);
      } else {
        setEvents(data || []);
      }

      setLoading(false);
    }

    loadEvents();
  }, []);

  // =========================
  // EVENTS FOR A DAY
  // =========================

  const getEventsForDay = (day: Date) => {
    const dateString = format(day, "yyyy-MM-dd");

    return events.filter(
      (event) => event.event_date === dateString
    );
  };

  return (
    <div className="mx-auto mt-10 max-w-7xl px-6 pb-12">

      {/* =========================
          MONTH HEADER
      ========================= */}

      <div className="mb-8 flex items-center justify-between">

        <button
          type="button"
          onClick={() =>
            setCurrentMonth(
              subMonths(currentMonth, 1)
            )
          }
          className="rounded-lg bg-white px-4 py-2 shadow transition hover:bg-blue-50"
        >
          ←
        </button>

        <h2 className="text-3xl font-bold text-blue-700">
          {format(currentMonth, "MMMM yyyy")}
        </h2>

        <button
          type="button"
          onClick={() =>
            setCurrentMonth(
              addMonths(currentMonth, 1)
            )
          }
          className="rounded-lg bg-white px-4 py-2 shadow transition hover:bg-blue-50"
        >
          →
        </button>

      </div>

      {/* =========================
          WEEK DAYS
      ========================= */}

      <div className="mb-4 grid grid-cols-7 gap-4">

        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}

      </div>

      {/* =========================
          CALENDAR GRID
      ========================= */}

      <div className="grid grid-cols-7 gap-4">

        {days.map((day) => {

          const dayEvents = getEventsForDay(day);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[140px] rounded-2xl border bg-white p-3 shadow-sm transition hover:shadow-md ${
                !isSameMonth(day, currentMonth)
                  ? "opacity-30"
                  : ""
              }`}
            >

              {/* DATE */}

              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full font-semibold ${
                  isToday(day)
                    ? "bg-blue-600 text-white"
                    : "text-gray-700"
                }`}
              >
                {format(day, "d")}
              </div>

              {/* =========================
                  EVENTS
              ========================= */}

              <div className="mt-3 space-y-2">

                {loading ? (
                  <div className="text-xs text-gray-400">
                    Loading...
                  </div>
                ) : dayEvents.length === 0 ? (
                  <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 text-xs text-blue-500">
                    No Event
                  </div>
                ) : (
                  dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        window.location.href =
                          `/event/${event.id}`;
                      }}
                      className="group w-full overflow-hidden rounded-xl border border-blue-100 bg-blue-50 text-left transition hover:border-blue-400 hover:shadow-md"
                    >

                      {/* POSTER */}

                      {event.poster_url ? (
                        <img
                          src={event.poster_url}
                          alt={event.event_name}
                          className="h-20 w-full object-cover transition group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-20 items-center justify-center bg-blue-100 text-xs text-blue-500">
                          No Poster
                        </div>
                      )}

                      {/* EVENT NAME */}

                      <div className="p-2">

                        <p className="line-clamp-2 text-xs font-bold text-gray-800">
                          {event.event_name}
                        </p>

                        <p className="mt-1 text-[11px] text-gray-500">
                          {event.event_time}
                        </p>

                      </div>

                    </button>
                  ))
                )}

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}