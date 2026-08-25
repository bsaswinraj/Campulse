"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type EventData = {
  id: string;
  community_id: string;
  event_name: string;
  description: string;
  venue: string;
  resource_person: string;
  event_date: string;
  event_time: string;
  registration_link: string | null;
  certificate_drive_link: string | null;
  poster_url: string | null;
  coordinators: string[] | null;
};

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();

  const eventId = params.id as string;

  const [event, setEvent] = useState<EventData | null>(null);

  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [resourcePerson, setResourcePerson] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [certificateLink, setCertificateLink] = useState("");
  const [coordinators, setCoordinators] = useState("");

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [currentPoster, setCurrentPoster] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // =========================================================
  // LOAD EVENT
  // =========================================================

  useEffect(() => {
    async function loadEvent() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/");
          return;
        }

        const { data, error } = await supabase
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
            certificate_drive_link,
            poster_url,
            coordinators
            `
          )
          .eq("id", eventId)
          .eq("community_id", user.id)
          .single();

        if (error) {
          console.error(error);

          setErrorMessage(
            "You do not have permission to edit this event."
          );

          setLoading(false);
          return;
        }

        setEvent(data);

        setEventName(data.event_name || "");
        setDescription(data.description || "");
        setVenue(data.venue || "");
        setResourcePerson(data.resource_person || "");
        setEventDate(data.event_date || "");
        setEventTime(data.event_time || "");
        setRegistrationLink(data.registration_link || "");

        // Load existing certificate link
        setCertificateLink(
          data.certificate_drive_link || ""
        );

        setCoordinators(
          Array.isArray(data.coordinators)
            ? data.coordinators.join(", ")
            : ""
        );

        setCurrentPoster(data.poster_url || "");

        setLoading(false);
      } catch (error) {
        console.error(error);

        setErrorMessage("Something went wrong.");
        setLoading(false);
      }
    }

    if (eventId) {
      loadEvent();
    }
  }, [eventId, router]);

  // =========================================================
  // POSTER SELECT
  // =========================================================

  function handlePosterChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    // LESS THAN 1 MB
    if (file.size >= 1024 * 1024) {
      alert("Poster image must be less than 1 MB.");
      e.target.value = "";
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a JPG, PNG, or WebP image.");
      e.target.value = "";
      return;
    }

    setPosterFile(file);
  }

  // =========================================================
  // SAVE EVENT
  // =========================================================

  async function handleSave() {
    if (!event) return;

    if (!eventName.trim()) {
      alert("Please enter the event name.");
      return;
    }

    if (!description.trim()) {
      alert("Please enter the description.");
      return;
    }

    if (!venue.trim()) {
      alert("Please enter the venue.");
      return;
    }

    if (!eventDate) {
      alert("Please select an event date.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You are not logged in.");
        return;
      }

      // =====================================================
      // POSTER
      // =====================================================

      let posterUrl = event.poster_url;

      if (posterFile) {
        const fileExtension =
          posterFile.name.split(".").pop()?.toLowerCase() ||
          "jpg";

        const fileName = `${user.id}/${eventId}-${Date.now()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("event-posters")
          .upload(fileName, posterFile, {
            upsert: true,
          });

        if (uploadError) {
          console.error(uploadError);
          alert("Unable to upload poster.");
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("event-posters")
          .getPublicUrl(fileName);

        posterUrl = publicUrlData.publicUrl;
      }

      // =====================================================
      // COORDINATORS
      // =====================================================

      const coordinatorArray = coordinators
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);

      // =====================================================
      // UPDATE EVENT
      // =====================================================

      const { error: updateError } = await supabase
        .from("events")
        .update({
          event_name: eventName.trim(),
          description: description.trim(),
          venue: venue.trim(),
          resource_person:
            resourcePerson.trim() || null,
          event_date: eventDate,
          event_time: eventTime,
          registration_link:
            registrationLink.trim() || null,

          // Certificate Drive link
          certificate_drive_link:
            certificateLink.trim() || null,

          poster_url: posterUrl,
          coordinators: coordinatorArray,
        })
        .eq("id", eventId)
        .eq("community_id", user.id);

      if (updateError) {
        console.error(updateError);
        alert(updateError.message);
        return;
      }

      alert("Event updated successfully! 🎉");

      router.push("/community");
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to update event.");
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="font-medium text-gray-600">
            Loading event...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (errorMessage || !event) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm border border-red-100">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl text-red-500">
            !
          </div>

          <h1 className="text-xl font-bold text-gray-900">
            Unable to load event
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            {errorMessage}
          </p>

          <button
            onClick={() => router.push("/community")}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
          >
            Back to Community
          </button>
        </div>
      </main>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6">

          <button
            onClick={() => router.push("/community")}
            className="mb-4 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            ← Back to Community
          </button>

          <h1 className="text-3xl font-extrabold text-gray-900">
            Edit Event
          </h1>

          <p className="mt-1 text-gray-500">
            Update the details of your event.
          </p>

        </div>
      </header>

      {/* FORM */}

      <section className="mx-auto max-w-4xl px-6 py-8">

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

          {/* EVENT NAME */}

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              Event Name
            </label>

            <input
              value={eventName}
              onChange={(e) =>
                setEventName(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Enter event name"
            />
          </div>

          {/* DESCRIPTION */}

          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              rows={5}
              className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Describe the event"
            />
          </div>

          {/* VENUE */}

          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-700">
              Venue
            </label>

            <input
              value={venue}
              onChange={(e) =>
                setVenue(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Event venue"
            />
          </div>

          {/* RESOURCE PERSON */}

          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-700">
              Resource Person
            </label>

            <input
              value={resourcePerson}
              onChange={(e) =>
                setResourcePerson(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Resource person"
            />
          </div>

          {/* DATE + TIME */}

          <div className="mt-5 grid gap-5 sm:grid-cols-2">

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Event Date
              </label>

              <input
                type="date"
                value={eventDate}
                onChange={(e) =>
                  setEventDate(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700">
                Event Time
              </label>

              <input
                type="time"
                value={eventTime}
                onChange={(e) =>
                  setEventTime(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>

          {/* REGISTRATION LINK */}

          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-700">
              Registration Link
            </label>

            <input
              type="url"
              value={registrationLink}
              onChange={(e) =>
                setRegistrationLink(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="https://..."
            />

            <p className="mt-1 text-xs text-gray-400">
              Students will be directed to this link when
              they click Register.
            </p>
          </div>

          {/* =================================================
              CERTIFICATE
          ================================================= */}

          <div className="mt-6">

            <label className="block text-sm font-semibold text-gray-700">
              Certificate Drive Link
              <span className="ml-1 font-normal text-gray-400">
                (Optional)
              </span>
            </label>

            <input
              type="url"
              value={certificateLink}
              onChange={(e) =>
                setCertificateLink(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="https://drive.google.com/..."
            />

            <p className="mt-1 text-xs text-gray-400">
              Add or update the Google Drive link containing
              certificates for participants.
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Students who registered for this event will be
              able to access the certificate from their profile.
            </p>

          </div>

          {/* COORDINATORS */}

          <div className="mt-5">
            <label className="block text-sm font-semibold text-gray-700">
              Coordinators
            </label>

            <input
              value={coordinators}
              onChange={(e) =>
                setCoordinators(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="John Doe, Jane Doe"
            />

            <p className="mt-1 text-xs text-gray-400">
              Separate multiple coordinators using commas.
            </p>
          </div>

          {/* POSTER */}

          <div className="mt-6">

            <label className="block text-sm font-semibold text-gray-700">
              Event Poster
            </label>

            {currentPoster && (
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                <img
                  src={currentPoster}
                  alt="Current event poster"
                  className="max-h-80 w-full object-contain bg-slate-50"
                />
              </div>
            )}

            <div className="mt-4 rounded-xl border-2 border-dashed border-gray-300 p-6 text-center">

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePosterChange}
                className="mx-auto block w-full text-sm text-gray-600"
              />

              <p className="mt-2 text-xs text-gray-400">
                Upload a new poster only if you want to replace
                the current one.
              </p>

              <p className="mt-1 text-xs font-medium text-blue-500">
                Maximum size: less than 1 MB
              </p>

              {posterFile && (
                <p className="mt-2 text-sm font-semibold text-green-600">
                  New poster selected: {posterFile.name}
                </p>
              )}

            </div>

          </div>

          {/* BUTTONS */}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={() => router.push("/community")}
              className="flex-1 rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>

          </div>

        </div>

      </section>
    </main>
  );
}