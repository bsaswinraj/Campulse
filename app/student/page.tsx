"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useScrollScale } from "@/hooks/useScrollScale";

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
  certificate_drive_link: string | null;
};

export default function StudentProfilePage() {
  const [profile, setProfile] =
    useState<StudentProfile | null>(null);

  const [upcomingEvents, setUpcomingEvents] =
    useState<Event[]>([]);

  const [pastEvents, setPastEvents] =
    useState<Event[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [eventsLoading, setEventsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  // =========================================================
  // SCROLL-DRIVEN FOCUS EFFECT
  // =========================================================

  const detailsRef =
    useScrollScale<HTMLDivElement>();

  const upcomingRef =
    useScrollScale<HTMLDivElement>();

  const pastRef =
    useScrollScale<HTMLDivElement>();

  // =========================================================
  // LOAD STUDENT PROFILE + EVENTS
  // =========================================================

  useEffect(() => {
    async function loadStudentProfile() {
      try {
        // =====================================================
        // GET CURRENT USER
        // =====================================================

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErrorMessage(
            "You are not logged in."
          );

          setLoading(false);
          setEventsLoading(false);

          return;
        }

        // =====================================================
        // LOAD STUDENT PROFILE
        // =====================================================

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("student_profiles")
          .select(
            `
              id,
              full_name,
              department,
              semester,
              email,
              phone,
              linkedin_url
            `
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error(profileError);

          setErrorMessage(
            profileError.message
          );

          setLoading(false);
          setEventsLoading(false);

          return;
        }

        setProfile(profileData);

        // =====================================================
        // LOAD REGISTERED EVENTS
        // =====================================================

        const {
          data: registrations,
          error: registrationError,
        } = await supabase
          .from("event_registrations")
          .select(
            "event_id, registered_at"
          )
          .eq("student_id", user.id)
          .order("registered_at", {
            ascending: false,
          });

        if (registrationError) {
          console.error(
            registrationError
          );

          setErrorMessage(
            registrationError.message
          );

          setLoading(false);
          setEventsLoading(false);

          return;
        }

        // =====================================================
        // NO REGISTERED EVENTS
        // =====================================================

        if (
          !registrations ||
          registrations.length === 0
        ) {
          setUpcomingEvents([]);
          setPastEvents([]);

          setEventsLoading(false);
          setLoading(false);

          return;
        }

        // =====================================================
        // GET EVENT IDS
        // =====================================================

        const eventIds =
          registrations.map(
            (registration) =>
              registration.event_id
          );

        // =====================================================
        // LOAD EVENTS
        // =====================================================

        const {
          data: events,
          error: eventsError,
        } = await supabase
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
              poster_url,
              certificate_drive_link
            `
          )
          .in("id", eventIds)
          .order("event_date", {
            ascending: true,
          });

        if (eventsError) {
          console.error(eventsError);

          setErrorMessage(
            eventsError.message
          );

          setEventsLoading(false);
          setLoading(false);

          return;
        }

        // =====================================================
        // SEPARATE UPCOMING AND PAST EVENTS
        // =====================================================

        const now = new Date();

        const upcoming: Event[] = [];
        const past: Event[] = [];

        (events || []).forEach(
          (event) => {
            const eventDateTime =
              new Date(
                `${event.event_date}T${
                  event.event_time ||
                  "00:00:00"
                }`
              );

            if (
              eventDateTime >= now
            ) {
              upcoming.push(event);
            } else {
              past.push(event);
            }
          }
        );

        // =====================================================
        // SORT EVENTS
        // =====================================================

        upcoming.sort(
          (a, b) =>
            new Date(
              `${a.event_date}T${
                a.event_time ||
                "00:00:00"
              }`
            ).getTime() -
            new Date(
              `${b.event_date}T${
                b.event_time ||
                "00:00:00"
              }`
            ).getTime()
        );

        past.sort(
          (a, b) =>
            new Date(
              `${b.event_date}T${
                b.event_time ||
                "00:00:00"
              }`
            ).getTime() -
            new Date(
              `${a.event_date}T${
                a.event_time ||
                "00:00:00"
              }`
            ).getTime()
        );

        setUpcomingEvents(upcoming);
        setPastEvents(past);

        setEventsLoading(false);
        setLoading(false);
      } catch (error) {
        console.error(error);

        setErrorMessage(
          "Something went wrong while loading your profile."
        );

        setEventsLoading(false);
        setLoading(false);
      }
    }

    loadStudentProfile();
  }, []);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatDate(
    date: string
  ) {
    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  // =========================================================
  // FORMAT TIME
  // =========================================================

  function formatTime(
    time: string
  ) {
    if (!time) {
      return "Time not specified";
    }

    return new Date(
      `1970-01-01T${time}`
    ).toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="font-medium text-slate-300">
            Loading your profile...
          </p>

        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (
    errorMessage ||
    !profile
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">

        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500">
            !
          </div>

          <h1 className="text-xl font-bold text-gray-900">
            Unable to load profile
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            {errorMessage ||
              "Student profile not found."}
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Calendar
          </button>

        </div>

      </main>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-250">

      {/* =====================================================
          BACKGROUND IMAGE
      ===================================================== */}

      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/profile-background.jpg')",
        }}
      />

      {/* =====================================================
          DARK OVERLAY
      ===================================================== */}

      <div className="fixed inset-0 -z-10 bg-slate-950/70" />

      {/* =====================================================
          BLUE ATMOSPHERIC GLOW
      ===================================================== */}

      <div className="pointer-events-none fixed left-1/2 top-1/3 -z-10 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[140px]" />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="relative border-b border-white/10 bg-white/85 shadow-sm backdrop-blur-xl">

        <div className="mx-auto max-w-7xl px-6 py-7">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            {/* STUDENT INFORMATION */}

            <div className="flex items-center gap-5">

              {/* PROFILE PLACEHOLDER */}

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50">

                <span className="text-xs font-medium text-blue-400">
                  PROFILE
                </span>

              </div>

              {/* NAME */}

              <div>

                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  Student Profile
                </p>

                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900">
                  {profile.full_name}
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  {profile.department}{" "}
                  • Semester{" "}
                  {profile.semester}
                </p>

              </div>

            </div>

            {/* CALENDAR BUTTON */}

            <button
              type="button"
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

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="relative mx-auto max-w-7xl px-6 py-10">

        {/* ===================================================
            PERSONAL DETAILS
        =================================================== */}

        <section
          ref={detailsRef}
          className="will-change-transform rounded-3xl border border-white/40 bg-white/90 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-[transform,opacity] duration-150 ease-out"
        >

          <div className="mb-5">

            <h2 className="text-xl font-bold text-gray-900">
              Personal Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Information associated with your CAMPULSE account.
            </p>

          </div>

          {/* DETAILS GRID */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* FULL NAME */}

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Full Name
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.full_name}
              </p>

            </div>

            {/* DEPARTMENT */}

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Department
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.department}
              </p>

            </div>

            {/* SEMESTER */}

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Semester
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                Semester {profile.semester}
              </p>

            </div>

            {/* PHONE */}

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Phone
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.phone}
              </p>

            </div>

          </div>

          {/* EMAIL + LINKEDIN */}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">

            {/* EMAIL */}

            <div className="rounded-xl bg-slate-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Email
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.email}
              </p>

            </div>

            {/* LINKEDIN */}

            {profile.linkedin_url && (
              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  LinkedIn
                </p>

                <a
                  href={
                    profile.linkedin_url
                  }
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

        {/* ===================================================
            UPCOMING EVENTS
        =================================================== */}

        <section
          ref={upcomingRef}
          className="will-change-transform mt-10 rounded-3xl transition-[transform,opacity] duration-150 ease-out"
        >

          <div>

            <h2 className="text-2xl font-bold text-white drop-shadow-sm">
              My Upcoming Events
            </h2>

            <p className="mt-1 text-sm text-slate-200">
              Events you have registered for through CAMPULSE.
            </p>

          </div>

          {/* LOADING */}

          {eventsLoading ? (
            <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-2xl border border-white/40 bg-white/90 shadow-xl backdrop-blur-xl">

              <div className="text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

                <p className="mt-3 text-sm text-gray-400">
                  Loading events...
                </p>

              </div>

            </div>

          ) : upcomingEvents.length === 0 ? (

            /* EMPTY STATE */

            <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-2xl border border-white/40 bg-white/90 shadow-xl backdrop-blur-xl">

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

            /* EVENT CARDS */

            <div className="mt-5 flex gap-5 overflow-x-auto pb-4">

              {upcomingEvents.map(
                (event) => (

                  <div
                    key={event.id}
                    className="w-[280px] shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >

                    {/* POSTER */}

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href =
                          `/event/${event.id}`;
                      }}
                      className="block w-full text-left"
                    >

                      {event.poster_url ? (
                        <img
                          src={event.poster_url}
                          alt={event.event_name}
                          className="h-40 w-full object-cover transition duration-500 hover:scale-[1.02]"
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
                          📅{" "}
                          {formatDate(
                            event.event_date
                          )}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          ⏰{" "}
                          {formatTime(
                            event.event_time
                          )}
                        </p>

                        <p className="mt-1 truncate text-sm text-gray-500">
                          📍 {event.venue}
                        </p>

                      </div>

                    </button>

                  </div>

                )
              )}

            </div>

          )}

        </section>

        {/* ===================================================
            PAST EVENTS
        =================================================== */}

        <section
          ref={pastRef}
          className="will-change-transform mt-10 rounded-3xl pb-12 transition-[transform,opacity] duration-150 ease-out"
        >

          <h2 className="text-2xl font-bold text-white drop-shadow-sm">
            Past Events
          </h2>

          <p className="mt-1 text-sm text-slate-200">
            Events you previously registered for on CAMPULSE.
          </p>

          {/* LOADING */}

          {eventsLoading ? (

            <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-2xl border border-white/40 bg-white/90 shadow-xl backdrop-blur-xl">

              <div className="text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

                <p className="mt-3 text-sm text-gray-400">
                  Loading events...
                </p>

              </div>

            </div>

          ) : pastEvents.length === 0 ? (

            /* EMPTY STATE */

            <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-2xl border border-white/40 bg-white/90 shadow-xl backdrop-blur-xl">

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

            /* PAST EVENT CARDS */

            <div className="mt-5 flex gap-5 overflow-x-auto pb-4">

              {pastEvents.map(
                (event) => (

                  <div
                    key={event.id}
                    className="w-[280px] shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >

                    {/* EVENT CONTENT */}

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href =
                          `/event/${event.id}`;
                      }}
                      className="block w-full text-left opacity-60 grayscale transition hover:opacity-75"
                    >

                      {/* POSTER */}

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

                      {/* DETAILS */}

                      <div className="p-4">

                        <h3 className="line-clamp-2 font-bold text-gray-800">
                          {event.event_name}
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                          📅{" "}
                          {formatDate(
                            event.event_date
                          )}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          ⏰{" "}
                          {formatTime(
                            event.event_time
                          )}
                        </p>

                        <p className="mt-1 truncate text-sm text-gray-400">
                          📍 {event.venue}
                        </p>

                      </div>

                    </button>

                    {/* =================================================
                        CERTIFICATE
                    ================================================= */}

                    {event.certificate_drive_link && (
                      <div className="border-t border-gray-100 p-4">

                        <a
                          href={
                            event.certificate_drive_link
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          📜 View Certificate
                        </a>

                      </div>
                    )}

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </section>

    </main>
  );
}