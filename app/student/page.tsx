"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type StudentProfile = {
  id: string;
  full_name: string;
  department: string;
  semester: number;
  email: string;
  phone: string;
  linkedin_url: string | null;
};

type Event = {
  id: string;
  event_name: string;
  description: string;
  venue: string;
  resource_person: string | null;
  event_date: string;
  event_time: string;
  poster_url: string | null;
  certificate_drive_link?: string | null;
};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);

  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadStudentProfile() {
      try {
        // =========================
        // GET CURRENT USER
        // =========================

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErrorMessage("You are not logged in.");
          setLoading(false);
          return;
        }

        // =========================
        // LOAD STUDENT PROFILE
        // =========================

        const { data, error } = await supabase
          .from("student_profiles")
          .select(
            "id, full_name, department, semester, email, phone, linkedin_url"
          )
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(error);
          setErrorMessage(error.message);
          setLoading(false);
          return;
        }

        setProfile(data);

        // =========================
        // LOAD REGISTRATIONS
        // =========================

        const { data: registrations, error: registrationError } =
          await supabase
            .from("event_registrations")
            .select("event_id, registered_at")
            .eq("student_id", user.id)
            .order("registered_at", {
              ascending: false,
            });

        if (registrationError) {
          console.error(registrationError);
          setEventsLoading(false);
          setLoading(false);
          return;
        }

        // No registered events
        if (!registrations || registrations.length === 0) {
          setUpcomingEvents([]);
          setPastEvents([]);
          setEventsLoading(false);
          setLoading(false);
          return;
        }

        // =========================
        // GET EVENT IDS
        // =========================

        const eventIds = registrations.map(
          (registration) => registration.event_id
        );

        // =========================
        // LOAD EVENTS
        // =========================

        const { data: events, error: eventsError } = await supabase
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
            poster_url
            `
          )
          .in("id", eventIds)
          .order("event_date", {
            ascending: true,
          });

        if (eventsError) {
          console.error(eventsError);
          setEventsLoading(false);
          setLoading(false);
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming: Event[] = [];
        const past: Event[] = [];

        (events || []).forEach((event) => {
          const eventDate = new Date(
            `${event.event_date}T00:00:00`
          );

          if (eventDate >= today) {
            upcoming.push(event);
          } else {
            past.push(event);
          }
        });

        setUpcomingEvents(upcoming);
        setPastEvents(past);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          "Something went wrong while loading your profile."
        );
      }

      setEventsLoading(false);
      setLoading(false);
    }

    loadStudentProfile();
  }, []);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="font-medium text-gray-600">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (errorMessage || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500">
            !
          </div>

          <h1 className="text-xl font-bold text-gray-900">
            Unable to load profile
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            {errorMessage || "Student profile not found."}
          </p>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
          >
            Back to Calendar
          </button>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* =========================
          HEADER
      ========================= */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-7">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            {/* Student information */}

            <div className="flex items-center gap-5">

              {/* Profile placeholder */}

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50">
                <span className="text-xs font-medium text-blue-400">
                  PROFILE
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  Student Profile
                </p>

                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900">
                  {profile.full_name}
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  {profile.department} • Semester {profile.semester}
                </p>
              </div>

            </div>

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              ← Calendar
            </button>

          </div>

        </div>
      </header>

      {/* =========================
          MAIN
      ========================= */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* =========================
            PERSONAL DETAILS
        ========================= */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Personal Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Information associated with your CAMPULSE account.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Full Name
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.full_name}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Department
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.department}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Semester
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                Semester {profile.semester}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Phone
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.phone}
              </p>
            </div>

          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Email
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.email}
              </p>
            </div>

            {profile.linkedin_url && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  LinkedIn
                </p>

                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block truncate font-semibold text-blue-600 hover:underline"
                >
                  {profile.linkedin_url}
                </a>
              </div>
            )}

          </div>

        </section>

        {/* =========================
            UPCOMING EVENTS
        ========================= */}

        <section className="mt-8">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              My Upcoming Events
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Events you have saved through CAMPULSE.
            </p>
          </div>

          {eventsLoading ? (
            <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
              <p className="text-sm text-gray-400">
                Loading events...
              </p>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
                  📅
                </div>

                <p className="mt-4 font-semibold text-gray-700">
                  No upcoming events
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  Events you register for will appear here.
                </p>

              </div>
            </div>
          ) : (
            <div className="mt-5 flex gap-5 overflow-x-auto pb-4">

              {upcomingEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    window.location.href = `/event/${event.id}`;
                  }}
                  className="w-[280px] shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >

                  {event.poster_url ? (
                    <img
                      src={event.poster_url}
                      alt={event.event_name}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-blue-50 text-sm text-blue-400">
                      No Poster
                    </div>
                  )}

                  <div className="p-4">

                    <h3 className="line-clamp-2 font-bold text-gray-900">
                      {event.event_name}
                    </h3>

                    <p className="mt-2 text-sm font-medium text-blue-600">
                      {event.event_date}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {event.event_time}
                    </p>

                    <p className="mt-1 truncate text-sm text-gray-500">
                      📍 {event.venue}
                    </p>

                  </div>

                </button>
              ))}

            </div>
          )}

        </section>

        {/* =========================
            PAST EVENTS
        ========================= */}

        <section className="mt-8 pb-12">

          <h2 className="text-2xl font-bold text-gray-900">
            Past Events
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Events you previously saved on CAMPULSE.
          </p>

          {eventsLoading ? (
            <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
              <p className="text-sm text-gray-400">
                Loading events...
              </p>
            </div>
          ) : pastEvents.length === 0 ? (
            <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">
                  🗂️
                </div>

                <p className="mt-4 font-semibold text-gray-700">
                  No past events
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  Your completed events will appear here.
                </p>

              </div>
            </div>
          ) : (
            <div className="mt-5 flex gap-5 overflow-x-auto pb-4">

              {pastEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    window.location.href = `/event/${event.id}`;
                  }}
                  className="w-[280px] shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white text-left opacity-55 grayscale transition hover:opacity-70"
                >

                  {event.poster_url ? (
                    <img
                      src={event.poster_url}
                      alt={event.event_name}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gray-100 text-sm text-gray-400">
                      No Poster
                    </div>
                  )}

                  <div className="p-4">

                    <h3 className="line-clamp-2 font-bold text-gray-800">
                      {event.event_name}
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      {event.event_date}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      📍 {event.venue}
                    </p>

                  </div>
{event.certificate_drive_link && (
  <a
    href={event.certificate_drive_link}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="mt-3 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    📜 View Certificate
  </a>
)}
                </button>
              ))}

            </div>
          )}

        </section>

      </section>

    </main>
  );
}