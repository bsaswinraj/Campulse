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

  const getEventsForDay = (day: Date) => {
    const dateString = format(day, "yyyy-MM-dd");

    return events.filter(
      (event) => event.event_date === dateString
    );
  };

  return (
    <div className="mx-auto mt-10 max-w-7xl px-6 pb-12">
      <div className="mb-8 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() =>
            setCurrentMonth(
              subMonths(currentMonth, 1)
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors duration-150 hover:border-blue-600 hover:bg-blue-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          <span className="text-blue-700">{format(currentMonth, "MMMM")}</span>{" "}
          {format(currentMonth, "yyyy")}
        </h2>

        <button
          type="button"
          aria-label="Next month"
          onClick={() =>
            setCurrentMonth(
              addMonths(currentMonth, 1)
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors duration-150 hover:border-blue-600 hover:bg-blue-600 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-4 border-b border-slate-200 pb-3">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-4 pt-4">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const inMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[140px] rounded-2xl border p-3 transition-all duration-200 ${
                inMonth
                  ? "border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)]"
                  : "border-transparent bg-slate-50/60 opacity-40"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isToday(day)
                    ? "bg-blue-600 text-white ring-2 ring-blue-200"
                    : "text-slate-700"
                }`}
              >
                {format(day, "d")}
              </div>

              <div className="mt-3 space-y-2">
                {loading ? (
                  <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
                ) : dayEvents.length === 0 ? (
                  inMonth && (
                    <p className="pt-3 text-center text-[11px] text-slate-300">
                      No events
                    </p>
                  )
                ) : (
                  dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => {
                        window.location.href =
                          `/event/${event.id}`;
                      }}
                      className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    >
                      <div className="relative h-24 w-full bg-blue-100">
                        {event.poster_url ? (
                          <img
                            src={event.poster_url}
                            alt={event.event_name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-600 to-slate-900 text-[11px] font-medium text-blue-100">
                            {event.event_name}
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                        <div className="absolute inset-x-0 bottom-0 p-2">
                          <p className="line-clamp-2 text-xs font-semibold text-white">
                            {event.event_name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-blue-100/90">
                            {event.event_time}
                          </p>
                        </div>
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