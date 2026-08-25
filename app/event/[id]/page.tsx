"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // LOAD EVENT
  // =========================

  useEffect(() => {
    async function loadEvent() {
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
        .eq("id", eventId)
        .single();

      if (error) {
        console.error(error);
        setError("Unable to load this event.");
        setLoading(false);
        return;
      }

      setEvent(data);
      setLoading(false);
    }

    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  // =========================
  // CHECK REGISTRATION
  // =========================

  useEffect(() => {
    async function checkRegistration() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", eventId)
        .eq("student_id", user.id)
        .maybeSingle();

      if (data) {
        setRegistered(true);
      }
    }

    if (eventId) {
      checkRegistration();
    }
  }, [eventId]);

  // =========================
  // REGISTER
  // =========================

 const handleRegister = async () => {
  setError("");
  setMessage("");
  setRegistering(true);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please login as a student to register.");
      setRegistering(false);
      return;
    }

    // Make sure the user is a student
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!profile || profile.role !== "student") {
      setError("Only student accounts can register for events.");
      setRegistering(false);
      return;
    }

    // Save the student's CAMPULSE registration
    const { error: registrationError } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        student_id: user.id,
      });

    if (registrationError) {
      // Already registered
      if (registrationError.code === "23505") {
        setRegistered(true);

        // Still open the external registration form
        if (event?.registration_link) {
          window.open(
            event.registration_link,
            "_blank",
            "noopener,noreferrer"
          );
        }

        setMessage(
          "You are already registered on CAMPULSE. Opening the community registration form..."
        );

        return;
      }

      throw registrationError;
    }

    // CAMPULSE registration successful
    setRegistered(true);

    // Open community's registration form
    if (event?.registration_link) {
      window.open(
        event.registration_link,
        "_blank",
        "noopener,noreferrer"
      );

      setMessage(
        "Saved on CAMPULSE! The community registration form has been opened in a new tab."
      );
    } else {
      setMessage(
        "Your event has been saved to CAMPULSE, but this community has not provided an external registration link."
      );
    }
  } catch (err: any) {
    console.error(err);

    setError(
      err.message || "Unable to register for this event."
    );
  } finally {
    setRegistering(false);
  }
};

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="font-medium text-gray-600">
            Loading event...
          </p>
        </div>
      </main>
    );
  }

  // =========================
  // ERROR
  // =========================

  if (error || !event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500">
            !
          </div>

          <h1 className="text-xl font-bold text-gray-900">
            Unable to load event
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            {error || "Event not found."}
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

  // =========================
  // EVENT PAGE
  // =========================

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Calendar
          </button>

        </div>
      </header>

      {/* CONTENT */}

      <section className="mx-auto max-w-6xl px-6 py-10">

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">

          {/* POSTER */}

          {event.poster_url ? (
            <div className="bg-slate-100">
              <img
                src={event.poster_url}
                alt={event.event_name}
                className="mx-auto max-h-[500px] w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center bg-blue-50 text-gray-400">
              No poster available
            </div>
          )}

          {/* DETAILS */}

          <div className="p-8">

            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Event Details
            </p>

            <h1 className="mt-2 text-4xl font-extrabold text-gray-900">
              {event.event_name}
            </h1>

            {/* INFO */}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Date
                </p>

                <p className="mt-2 font-semibold text-gray-900">
                  {event.event_date}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Time
                </p>

                <p className="mt-2 font-semibold text-gray-900">
                  {event.event_time}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Venue
                </p>

                <p className="mt-2 font-semibold text-gray-900">
                  {event.venue}
                </p>
              </div>

              {event.resource_person && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Resource Person
                  </p>

                  <p className="mt-2 font-semibold text-gray-900">
                    {event.resource_person}
                  </p>
                </div>
              )}

            </div>

            {/* DESCRIPTION */}

            <div className="mt-8">

              <h2 className="text-xl font-bold text-gray-900">
                About the Event
              </h2>

              <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">
                {event.description}
              </p>

            </div>

            {/* COORDINATORS */}

            {event.coordinators && (
              <div className="mt-8">

                <h2 className="text-xl font-bold text-gray-900">
                  Coordinators
                </h2>

                <p className="mt-3 text-gray-600">
                  {event.coordinators}
                </p>

              </div>
            )}

            {/* REGISTRATION */}

            <div className="mt-10 border-t border-gray-200 pt-8">

              {registered ? (
  <div className="rounded-2xl bg-green-50 p-6">
    <div className="flex items-start gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
        ✓
      </div>

      <div>
        <h3 className="font-bold text-green-800">
          Saved to your CAMPULSE events
        </h3>

        <p className="mt-1 text-sm text-green-700">
          You have saved this event. Complete the
          community's registration form to officially
          register for the event.
        </p>

        {event.registration_link && (
          <button
            type="button"
            onClick={() =>
              window.open(
                event.registration_link!,
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Open Registration Form
          </button>
        )}
      </div>

    </div>
  </div>
) : (
  <button
    onClick={handleRegister}
    disabled={registering}
    className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {registering ? "Opening..." : "Register for Event"}
  </button>
)}

              {/* SUCCESS */}

              {message && (
                <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
                  {message}
                </div>
              )}

              {/* ERROR */}

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}