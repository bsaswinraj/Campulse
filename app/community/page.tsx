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

export default function CommunityPage() {
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCommunityProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErrorMessage("You are not logged in.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("community_profiles")
          .select(
            "id, community_name, convener_name, faculty_coordinator_name, email, phone"
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
      } catch (error) {
        console.error(error);
        setErrorMessage("Something went wrong while loading your profile.");
      }

      setLoading(false);
    }

    loadCommunityProfile();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="text-gray-600 font-medium">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || !profile) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl bg-white border border-red-100 shadow-sm p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 text-2xl">
            !
          </div>

          <h1 className="text-xl font-bold text-gray-900">
            Unable to load profile
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            {errorMessage || "Community profile not found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ================= HEADER ================= */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-7">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            {/* Community information */}

            <div className="flex items-center gap-5">

              {/* Empty logo space for now */}

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

            {/* Create Event */}

            <button
              onClick={() => {
                window.location.href = "/community/create-event";
              }}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              + Create Event
            </button>

          </div>

        </div>
      </header>

      {/* ================= MAIN ================= */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* Community details */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Community Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Information associated with your community account.
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

        {/* ================= UPCOMING EVENTS ================= */}

        <section className="mt-8">

          <div className="flex items-end justify-between">

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Upcoming Events
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Events hosted by your community that are yet to happen.
              </p>
            </div>

          </div>

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

        </section>

        {/* ================= PAST EVENTS ================= */}

        <section className="mt-8 pb-12">

          <h2 className="text-2xl font-bold text-gray-900">
            Past Events
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Your previously hosted events and their certificates.
          </p>

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

        </section>

      </section>

    </main>
  );
}