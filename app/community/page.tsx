"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CommunityProfile = {
  id: string;
  community_name: string;
  convener_name: string;
  faculty_coordinator_name: string;
  email: string;
  phone: string;
};

type Event = {
  id: string;
  community_id: string;
  event_name: string;
  description: string;
  venue: string;
  resource_person: string;
  event_date: string;
  event_time: string;
  registration_link: string | null;
  poster_url: string | null;
  coordinators: string[] | null;
  certificate_drive_link: string | null;
};

export default function CommunityPage() {
  const [profile, setProfile] =
    useState<CommunityProfile | null>(null);

  const [events, setEvents] = useState<Event[]>([]);

  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [deleteLoading, setDeleteLoading] =
    useState<string | null>(null);

  // =========================================================
  // CERTIFICATE
  // =========================================================

  const [certificateEventId, setCertificateEventId] =
    useState<string | null>(null);

  const [certificateLink, setCertificateLink] =
    useState("");

  const [certificateSaving, setCertificateSaving] =
    useState<string | null>(null);

  // =========================================================
  // LOAD PROFILE + EVENTS
  // =========================================================

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErrorMessage("You are not logged in.");
          setLoading(false);
          setEventsLoading(false);
          return;
        }

        // -----------------------------------------------------
        // LOAD COMMUNITY PROFILE
        // -----------------------------------------------------

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("community_profiles")
          .select(
            "id, community_name, convener_name, faculty_coordinator_name, email, phone"
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error(profileError);

          setErrorMessage(profileError.message);
          setLoading(false);
          setEventsLoading(false);

          return;
        }

        setProfile(profileData);
        setLoading(false);

        // -----------------------------------------------------
        // LOAD EVENTS
        // -----------------------------------------------------

        const {
          data: eventData,
          error: eventError,
        } = await supabase
          .from("events")
          .select(
            `
            id,
            community_id,
            event_name,
            description,
            venue,
            resource_person,
            event_date,
            event_time,
            registration_link,
            poster_url,
            coordinators,
            certificate_drive_link
          `
          )
          .eq("community_id", user.id)
          .order("event_date", {
            ascending: true,
          });

        if (eventError) {
          console.error(eventError);

          setErrorMessage(eventError.message);
          setEventsLoading(false);

          return;
        }

        setEvents(eventData || []);
        setEventsLoading(false);
      } catch (error) {
        console.error(error);

        setErrorMessage(
          "Something went wrong while loading your community."
        );

        setLoading(false);
        setEventsLoading(false);
      }
    }

    loadData();
  }, []);

  // =========================================================
  // DELETE EVENT
  // =========================================================

  async function deleteEvent(eventId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(eventId);

      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      setEvents((previousEvents) =>
        previousEvents.filter(
          (event) => event.id !== eventId
        )
      );
    } catch (error) {
      console.error(error);
      alert("Unable to delete event.");
    } finally {
      setDeleteLoading(null);
    }
  }

  // =========================================================
  // SAVE CERTIFICATE DRIVE LINK
  // =========================================================

  async function saveCertificateLink(eventId: string) {
    if (!certificateLink.trim()) {
      alert("Please enter the certificate Drive link.");
      return;
    }

    try {
      setCertificateSaving(eventId);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You are not logged in.");
        return;
      }

      // -----------------------------------------------------
      // VERIFY EVENT OWNERSHIP
      // -----------------------------------------------------

      const {
        data: eventData,
        error: eventError,
      } = await supabase
        .from("events")
        .select("id")
        .eq("id", eventId)
        .eq("community_id", user.id)
        .single();

      if (eventError || !eventData) {
        alert(
          "You do not have permission to update this event."
        );

        return;
      }

      // -----------------------------------------------------
      // UPDATE CERTIFICATE DRIVE LINK
      // -----------------------------------------------------

      const { error: updateError } = await supabase
        .from("events")
        .update({
          certificate_drive_link:
            certificateLink.trim(),
        })
        .eq("id", eventId)
        .eq("community_id", user.id);

      if (updateError) {
        console.error(updateError);
        alert(updateError.message);
        return;
      }

      // -----------------------------------------------------
      // UPDATE LOCAL STATE
      // -----------------------------------------------------

      setEvents((previousEvents) =>
        previousEvents.map((event) =>
          event.id === eventId
            ? {
                ...event,
                certificate_drive_link:
                  certificateLink.trim(),
              }
            : event
        )
      );

      setCertificateEventId(null);
      setCertificateLink("");

      alert(
        "Certificate Drive link added successfully! 🎉"
      );
    } catch (error) {
      console.error(error);
      alert("Unable to save certificate Drive link.");
    } finally {
      setCertificateSaving(null);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

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

  // =========================================================
  // ERROR
  // =========================================================

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
            {errorMessage ||
              "Community profile not found."}
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // SEPARATE UPCOMING / PAST EVENTS
  // =========================================================

  const now = new Date();

  const upcomingEvents = events.filter((event) => {
    const eventDateTime = new Date(
      `${event.event_date}T${
        event.event_time || "00:00:00"
      }`
    );

    return eventDateTime >= now;
  });

  const pastEvents = events.filter((event) => {
    const eventDateTime = new Date(
      `${event.event_date}T${
        event.event_time || "00:00:00"
      }`
    );

    return eventDateTime < now;
  });

  // =========================================================
  // EVENT CARD
  // =========================================================

  function EventCard({
    event,
    past = false,
  }: {
    event: Event;
    past?: boolean;
  }) {
    const formattedDate = new Date(
      `${event.event_date}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const formattedTime = event.event_time
      ? new Date(
          `1970-01-01T${event.event_time}`
        ).toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
        })
      : "Time not specified";

    return (
      <article
        className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md ${
          past ? "opacity-60" : ""
        }`}
      >
        {/* =====================================================
            POSTER
        ===================================================== */}

        <div className="relative h-52 w-full overflow-hidden bg-slate-100">
          {event.poster_url ? (
            <img
              src={event.poster_url}
              alt={event.event_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="text-4xl">
                  🖼️
                </div>

                <p className="mt-2 text-sm text-gray-400">
                  No poster uploaded
                </p>
              </div>
            </div>
          )}

          {/* STATUS */}

          <div className="absolute left-4 top-4">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
                past
                  ? "bg-gray-700 text-white"
                  : "bg-green-500 text-white"
              }`}
            >
              {past ? "COMPLETED" : "UPCOMING"}
            </span>
          </div>
        </div>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="p-5">
          <h3 className="text-xl font-bold text-gray-900">
            {event.event_name}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm text-gray-500">
            {event.description}
          </p>

          {/* EVENT DETAILS */}

          <div className="mt-5 space-y-3">
            {/* DATE */}

            <div className="flex items-center gap-3">
              <span className="text-lg">
                📅
              </span>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Date
                </p>

                <p className="text-sm font-medium text-gray-800">
                  {formattedDate}
                </p>
              </div>
            </div>

            {/* TIME */}

            <div className="flex items-center gap-3">
              <span className="text-lg">
                ⏰
              </span>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Time
                </p>

                <p className="text-sm font-medium text-gray-800">
                  {formattedTime}
                </p>
              </div>
            </div>

            {/* VENUE */}

            <div className="flex items-center gap-3">
              <span className="text-lg">
                📍
              </span>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">
                  Venue
                </p>

                <p className="text-sm font-medium text-gray-800">
                  {event.venue}
                </p>
              </div>
            </div>

            {/* RESOURCE PERSON */}

            {event.resource_person && (
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  👤
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">
                    Resource Person
                  </p>

                  <p className="text-sm font-medium text-gray-800">
                    {event.resource_person}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ===================================================
              UPCOMING EVENT ACTIONS
          =================================================== */}

          {!past && (
            <div className="mt-6 flex gap-3 border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    `/community/edit-event/${event.id}`;
                }}
                className="flex-1 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() =>
                  deleteEvent(event.id)
                }
                disabled={
                  deleteLoading === event.id
                }
                className="flex-1 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {deleteLoading === event.id
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          )}

          {/* ===================================================
              PAST EVENT / CERTIFICATE
          =================================================== */}

          {past && (
            <div className="mt-6 border-t border-gray-100 pt-5">

              {/* -------------------------------------------------
                  CERTIFICATE ALREADY AVAILABLE
              ------------------------------------------------- */}

              {event.certificate_drive_link &&
                certificateEventId !== event.id && (
                  <div className="space-y-3">

                    <a
                      href={
                        event.certificate_drive_link
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      📜 View Certificates
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setCertificateEventId(
                          event.id
                        );

                        setCertificateLink(
                          event.certificate_drive_link ||
                            ""
                        );
                      }}
                      className="block w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                    >
                      ✏️ Edit Certificate Drive Link
                    </button>

                  </div>
                )}

              {/* -------------------------------------------------
                  NO CERTIFICATE LINK
              ------------------------------------------------- */}

              {!event.certificate_drive_link &&
                certificateEventId !== event.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setCertificateEventId(
                        event.id
                      );

                      setCertificateLink("");
                    }}
                    className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    📜 Add Certificate Drive Link
                  </button>
                )}

              {/* -------------------------------------------------
                  CERTIFICATE EDITOR
              ------------------------------------------------- */}

              {certificateEventId === event.id && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                  <p className="text-sm font-bold text-gray-900">
                    {event.certificate_drive_link
                      ? "Edit Certificate Drive Link"
                      : "Add Certificate Drive Link"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Add the Google Drive link containing
                    the certificates for this event.
                  </p>

                  <input
                    type="url"
                    value={certificateLink}
                    onChange={(e) =>
                      setCertificateLink(
                        e.target.value
                      )
                    }
                    placeholder="https://drive.google.com/..."
                    className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />

                  <div className="mt-3 flex gap-3">

                    <button
                      type="button"
                      onClick={() => {
                        setCertificateEventId(
                          null
                        );

                        setCertificateLink("");
                      }}
                      className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        saveCertificateLink(
                          event.id
                        )
                      }
                      disabled={
                        certificateSaving ===
                        event.id
                      }
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {certificateSaving ===
                      event.id
                        ? "Saving..."
                        : "Save Certificate"}
                    </button>

                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </article>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-50">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-7">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-5">

              {/* LOGO */}

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50">
                <span className="text-xs font-medium text-blue-400">
                  LOGO
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  Community Profile
                </p>

                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900">
                  {profile.community_name}
                </h1>
              </div>

            </div>

            {/* CREATE EVENT */}

            <button
              type="button"
              onClick={() => {
                window.location.href =
                  "/community/create-event";
              }}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              + Create Event
            </button>

          </div>

        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* ===================================================
            COMMUNITY DETAILS
        =================================================== */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Community Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Information associated with your community
              account.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Community
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.community_name}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Convener
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.convener_name}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Faculty Coordinator
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.faculty_coordinator_name}
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

          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Email
            </p>

            <p className="mt-2 font-semibold text-gray-900">
              {profile.email}
            </p>
          </div>

        </section>

        {/* ===================================================
            UPCOMING EVENTS
        =================================================== */}

        <section className="mt-10">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Upcoming Events
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Events hosted by your community that are yet
              to happen.
            </p>
          </div>

          {eventsLoading ? (
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-10 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

              <p className="mt-3 text-sm text-gray-500">
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
                  Create your first event to see it here.
                </p>

              </div>

            </div>
          ) : (
            <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                />
              ))}

            </div>
          )}

        </section>

        {/* ===================================================
            PAST EVENTS
        =================================================== */}

        <section className="mt-12 pb-12">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Past Events
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Previously hosted events by your community.
            </p>
          </div>

          {eventsLoading ? null : pastEvents.length === 0 ? (
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
            <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {pastEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  past
                />
              ))}

            </div>
          )}

        </section>

      </section>
    </main>
  );
}