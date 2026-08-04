"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateEventPage() {
  const router = useRouter();

  const [eventName, setEventName] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [resourcePerson, setResourcePerson] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [registrationLink, setRegistrationLink] = useState("");
  const [coordinators, setCoordinators] = useState("");

  // Poster
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =========================
  // POSTER SELECTION
  // =========================

  const handlePosterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setErrorMessage("");

    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Maximum 1 MB
    const maxSize = 1 * 1024 * 1024;

    if (file.size > maxSize) {
      setPosterFile(null);
      setPosterPreview("");

      e.target.value = "";

      setErrorMessage(
        "Poster size must be less than or equal to 1 MB."
      );

      return;
    }

    // Allowed image types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setPosterFile(null);
      setPosterPreview("");

      e.target.value = "";

      setErrorMessage(
        "Please upload a JPG, PNG, or WebP image."
      );

      return;
    }

    setPosterFile(file);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPosterPreview(previewUrl);
  };

  // =========================
  // CREATE EVENT
  // =========================

  const handleCreateEvent = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    // Validation
    if (!eventName.trim()) {
      setErrorMessage("Please enter the event name.");
      return;
    }

    if (!description.trim()) {
      setErrorMessage("Please enter the event description.");
      return;
    }

    if (!venue.trim()) {
      setErrorMessage("Please enter the venue.");
      return;
    }

    if (!eventDate) {
      setErrorMessage("Please select the event date.");
      return;
    }

    if (!eventTime) {
      setErrorMessage("Please select the event time.");
      return;
    }

    if (!posterFile) {
      setErrorMessage("Please upload an event poster.");
      return;
    }

    setLoading(true);

    let uploadedPosterPath = "";

    try {
      // =========================
      // GET CURRENT USER
      // =========================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("You are not logged in.");
      }

      // =========================
      // VERIFY COMMUNITY
      // =========================

      const { data: communityProfile, error: communityError } =
        await supabase
          .from("community_profiles")
          .select("id")
          .eq("id", user.id)
          .single();

      if (communityError || !communityProfile) {
        throw new Error(
          "Community profile not found. Please log in as a community."
        );
      }

      // =========================
      // CREATE UNIQUE FILE NAME
      // =========================

      const fileExtension =
        posterFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${crypto.randomUUID()}.${fileExtension}`;

      // Store files inside a folder for the community
      const filePath = `${user.id}/${fileName}`;

      uploadedPosterPath = filePath;

      // =========================
      // UPLOAD POSTER
      // =========================

      const { error: uploadError } = await supabase.storage
        .from("event-posters")
        .upload(filePath, posterFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: posterFile.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      // =========================
      // GET PUBLIC URL
      // =========================

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("event-posters")
        .getPublicUrl(filePath);

      // =========================
      // INSERT EVENT
      // =========================

      const { error: insertError } = await supabase
        .from("events")
        .insert({
          community_id: user.id,
          event_name: eventName.trim(),
          description: description.trim(),
          venue: venue.trim(),
          resource_person:
            resourcePerson.trim() || null,
          event_date: eventDate,
          event_time: eventTime,
          registration_link:
            registrationLink.trim() || null,
          poster_url: publicUrl,
          coordinators: coordinators.trim() || null,
        });

      if (insertError) {
        // If database insertion fails, remove uploaded poster
        await supabase.storage
          .from("event-posters")
          .remove([uploadedPosterPath]);

        throw insertError;
      }

      setSuccessMessage(
        "Event created successfully! 🎉"
      );

      // Return to community profile
      setTimeout(() => {
        router.push("/community");
      }, 1000);

    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.message ||
          "Something went wrong while creating the event."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ================= HEADER ================= */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Community
            </p>

            <h1 className="mt-1 text-3xl font-extrabold text-gray-900">
              Create Event
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Publish a new event to CAMPULSE.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/community")}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Back
          </button>

        </div>
      </header>

      {/* ================= FORM ================= */}

      <section className="mx-auto max-w-5xl px-6 py-8">

        <form
          onSubmit={handleCreateEvent}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >

          {/* EVENT INFORMATION */}

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Event Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter the basic information about your event.
            </p>
          </div>

          <div className="mt-6 grid gap-5">

            {/* EVENT NAME */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Event Name *
              </label>

              <input
                type="text"
                value={eventName}
                onChange={(e) =>
                  setEventName(e.target.value)
                }
                placeholder="Eg: National Level Hackathon"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* DESCRIPTION */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Description *
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Describe your event..."
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* VENUE */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Venue *
              </label>

              <input
                type="text"
                value={venue}
                onChange={(e) =>
                  setVenue(e.target.value)
                }
                placeholder="Eg: Main Auditorium"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* RESOURCE PERSON */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Resource Person
                <span className="ml-1 font-normal text-gray-400">
                  (Optional)
                </span>
              </label>

              <input
                type="text"
                value={resourcePerson}
                onChange={(e) =>
                  setResourcePerson(e.target.value)
                }
                placeholder="Eg: Dr. John Doe"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>

          {/* DATE & TIME */}

          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-900">
              Date & Time
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              When will the event take place?
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">

            {/* DATE */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Event Date *
              </label>

              <input
                type="date"
                value={eventDate}
                onChange={(e) =>
                  setEventDate(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* TIME */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Event Time *
              </label>

              <input
                type="time"
                value={eventTime}
                onChange={(e) =>
                  setEventTime(e.target.value)
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>

          {/* REGISTRATION */}

          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-900">
              Registration
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add the link students should use to register.
            </p>
          </div>

          <div className="mt-6">

            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Registration Link
              <span className="ml-1 font-normal text-gray-400">
                (Optional)
              </span>
            </label>

            <input
              type="url"
              value={registrationLink}
              onChange={(e) =>
                setRegistrationLink(e.target.value)
              }
              placeholder="https://..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* ================= POSTER ================= */}

          <div className="mt-10">

            <h2 className="text-xl font-bold text-gray-900">
              Event Poster
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Upload an event poster. Maximum size: 1 MB.
            </p>

          </div>

          <div className="mt-6">

            <label
              htmlFor="poster"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-100"
            >

              <div className="text-4xl">
                🖼️
              </div>

              <p className="mt-3 font-semibold text-blue-700">
                Choose Event Poster
              </p>

              <p className="mt-1 text-sm text-blue-500">
                JPG, PNG or WebP • Maximum 1 MB
              </p>

              <input
                id="poster"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePosterChange}
                className="hidden"
              />

            </label>

            {/* POSTER PREVIEW */}

            {posterPreview && (
              <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">

                <div className="border-b border-gray-200 bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Poster Preview
                  </p>
                </div>

                <div className="flex justify-center p-5">
                  <img
                    src={posterPreview}
                    alt="Event poster preview"
                    className="max-h-[450px] rounded-xl object-contain shadow-sm"
                  />
                </div>

                {posterFile && (
                  <div className="border-t border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                    <p>
                      <span className="font-semibold text-gray-700">
                        File:
                      </span>{" "}
                      {posterFile.name}
                    </p>

                    <p className="mt-1">
                      <span className="font-semibold text-gray-700">
                        Size:
                      </span>{" "}
                      {(posterFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* ================= COORDINATORS ================= */}

          <div className="mt-10">

            <h2 className="text-xl font-bold text-gray-900">
              Coordinators
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter the names of the event coordinators.
            </p>

          </div>

          <div className="mt-6">

            <textarea
              value={coordinators}
              onChange={(e) =>
                setCoordinators(e.target.value)
              }
              placeholder="Eg: Aswin Raj, Rahul Kumar, Priya S"
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          {/* ================= MESSAGES ================= */}

          {errorMessage && (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm font-medium text-green-600">
              {successMessage}
            </div>
          )}

          {/* ================= BUTTONS ================= */}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() => router.push("/community")}
              className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Uploading & Creating..."
                : "Create Event"}
            </button>

          </div>

        </form>

      </section>

    </main>
  );
}