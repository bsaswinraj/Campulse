"use client";

import { useEffect, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "signup" | null;
type UserRole = "student" | "community" | null;

export default function Navbar() {
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // CHECK CURRENT SESSION
  // =========================

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await loadUserRole(session.user.id);
      } else {
        setUserRole(null);
      }

      setLoading(false);
    }

    loadSession();

    // =========================
    // LISTEN FOR AUTH CHANGES
    // =========================

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadUserRole(session.user.id);
        } else {
          setUserRole(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // GET USER ROLE
  // =========================

  async function loadUserRole(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Unable to load user role:", error);
      setUserRole(null);
      return;
    }

    if (
      data?.role === "student" ||
      data?.role === "community"
    ) {
      setUserRole(data.role);
    } else {
      setUserRole(null);
    }
  }

  // =========================
  // LOGOUT
  // =========================

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      return;
    }

    setUserRole(null);

    window.location.href = "/";
  }

  // =========================
  // PROFILE
  // =========================

  function handleProfile() {
    if (userRole === "student") {
      window.location.href = "/student";
    }

    if (userRole === "community") {
      window.location.href = "/community";
    }
  }

  // =========================
  // CALENDAR
  // =========================

  function handleCalendar() {
    window.location.href = "/calendar";
  }

  return (
    <>
      <nav className="w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">

          {/* =========================
              LEFT SIDE
          ========================= */}

          <div className="flex items-center gap-4">

            {/* LOGO PLACEHOLDER */}

            <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50">
              <span className="text-xs font-semibold text-blue-400">
                Empty
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-wide text-blue-700">
                CAMPULSE
              </h1>

              <p className="text-sm italic text-gray-500">
                Unite the Separated
              </p>
            </div>

          </div>

          {/* =========================
              RIGHT SIDE
          ========================= */}

          <div className="flex items-center gap-3">

            {/* =========================
                LOGGED OUT
            ========================= */}

            {!loading && userRole === null && (
              <>
                {/* LOGIN */}

                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="rounded-lg px-6 py-2 font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  Login
                </button>

                {/* SIGN UP */}

                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white shadow-md transition hover:bg-blue-700"
                >
                  Sign Up
                </button>
              </>
            )}

            {/* =========================
                LOGGED IN
            ========================= */}

            {!loading && userRole !== null && (
              <>
              

                {/* PROFILE */}

                <button
                  type="button"
                  onClick={handleProfile}
                  className="rounded-lg px-5 py-2 font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  Profile
                </button>

                {/* LOGOUT */}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-gray-800 px-6 py-2 font-semibold text-white shadow-md transition hover:bg-gray-900"
                >
                  Logout
                </button>
              </>
            )}

          </div>

        </div>
      </nav>

      {/* =========================
          AUTH MODAL
      ========================= */}

      {authMode !== null && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
        />
      )}
    </>
  );
}