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

export default function StudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadStudentProfile() {
      try {
        // Get currently logged-in user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setErrorMessage("You are not logged in.");
          setLoading(false);
          return;
        }

        // Get student profile
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
      } catch (error) {
        console.error(error);
        setErrorMessage(
          "Something went wrong while loading your profile."
        );
      }

      setLoading(false);
    }

    loadStudentProfile();
  }, []);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
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
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
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
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Calendar
          </button>
        </div>
      </main>
    );
  }

  // =========================
  // STUDENT PROFILE
  // =========================

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ================= HEADER ================= */}

      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

            {/* Student information */}

            <div className="flex items-center gap-5">

              {/* Profile placeholder */}

              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-blue-50 border-2 border-dashed border-blue-200">
                <span className="text-2xl">
                  👤
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
                  {profile.department} • Semester{" "}
                  {profile.semester}
                </p>
              </div>

            </div>

            {/* Calendar button */}

            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              📅 Calendar
            </button>

          </div>

        </div>
      </header>

      {/* ================= MAIN ================= */}

      <section className="mx-auto max-w-7xl px-6 py-8">

        {/* ================= PERSONAL INFORMATION ================= */}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Information associated with your CAMPULSE account.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {/* Name */}

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Name
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.full_name}
              </p>
            </div>

            {/* Department */}

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Department
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.department}
              </p>
            </div>

            {/* Semester */}

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Semester
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                Semester {profile.semester}
              </p>
            </div>

            {/* Phone */}

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Phone
              </p>

              <p className="mt-2 font-semibold text-gray-900">
                {profile.phone}
              </p>
            </div>

          </div>

          {/* Email */}

          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Email
            </p>

            <p className="mt-2 font-semibold text-gray-900">
              {profile.email}
            </p>
          </div>

          {/* LinkedIn */}

          {profile.linkedin_url && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                LinkedIn
              </p>

              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block font-semibold text-blue-600 hover:underline"
              >
                View LinkedIn Profile →
              </a>
            </div>
          )}

        </section>

        {/* ================= REGISTERED EVENTS ================= */}

        <section className="mt-8">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              My Events
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your registered events will appear here.
            </p>
          </div>

          {/* Upcoming event placeholder */}

          <div className="mt-5 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl">
                ⏳
              </div>

              <div>
                <h3 className="font-bold text-gray-800">
                  Upcoming Event
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Your next registered event will appear here.
                </p>
              </div>

            </div>

          </div>

          {/* Past events */}

          <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
                🗂️
              </div>

              <div>
                <h3 className="font-bold text-gray-700">
                  Past Events
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  Your completed events will appear here.
                </p>
              </div>

            </div>

          </div>

        </section>

        {/* ================= CERTIFICATES ================= */}

        <section className="mt-8 pb-12">

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl">
                  📜
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Certificates
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Your event certificates will appear here.
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                View Certificates
              </button>

            </div>

          </div>

        </section>

      </section>
    </main>
  );
}