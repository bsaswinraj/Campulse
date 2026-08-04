"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "signup";
type UserRole = "student" | "community";

interface AuthModalProps {
  mode: AuthMode;
  onClose: () => void;
}

export default function AuthModal({
  mode,
  onClose,
}: AuthModalProps) {
  const [role, setRole] = useState<UserRole>("student");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Student fields
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  // Community fields
  const [communityName, setCommunityName] = useState("");
  const [convenerName, setConvenerName] = useState("");
  const [facultyCoordinatorName, setFacultyCoordinatorName] =
    useState("");

  // Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isLogin = mode === "login";

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const validateEmail = () => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = () => {
    return /^[0-9]{10}$/.test(phone);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    resetMessages();

    if (!validateEmail()) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (isLogin) {
      await handleLogin();
    } else {
      await handleSignup();
    }
  };

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async () => {
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.user) {
        throw new Error("Login failed. Please try again.");
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

      if (profileError) {
        throw new Error(
          "Could not find your account profile."
        );
      }

      if (profile.role !== role) {
        await supabase.auth.signOut();

        throw new Error(
          `This account is registered as a ${profile.role}. Please select ${profile.role} to login.`
        );
      }

      setSuccess("Login successful! 🎉");

      setTimeout(() => {
        if (profile.role === "student") {
          window.location.href = "/student";
        } else {
          window.location.href = "/community";
        }
      }, 700);
    } catch (err: any) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SIGNUP
  // =========================

  const handleSignup = async () => {
    if (!validatePhone()) {
      setError(
        "Phone number must contain exactly 10 digits."
      );
      return;
    }

    if (role === "student") {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }

      if (!department.trim()) {
        setError("Please enter your department.");
        return;
      }

      if (!semester) {
        setError("Please select your semester.");
        return;
      }
    }

    if (role === "community") {
      if (!communityName.trim()) {
        setError("Please enter the community name.");
        return;
      }

      if (!convenerName.trim()) {
        setError("Please enter the convener name.");
        return;
      }

      if (!facultyCoordinatorName.trim()) {
        setError(
          "Please enter the faculty coordinator name."
        );
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Create authentication account
      const { data, error: signupError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signupError) {
        throw signupError;
      }

      if (!data.user) {
        throw new Error("Account creation failed.");
      }

      const userId = data.user.id;

      // 2. Create main profile
      const { error: profileError } =
        await supabase.from("profiles").insert({
          id: userId,
          role,
        });

      if (profileError) {
        await supabase.auth.signOut();
        throw profileError;
      }

      // 3. Create student profile
      if (role === "student") {
        const { error: studentError } =
          await supabase
            .from("student_profiles")
            .insert({
              id: userId,
              full_name: fullName.trim(),
              department: department.trim(),
              semester: Number(semester),
              email: email.trim(),
              phone: phone.trim(),
              linkedin_url:
                linkedinUrl.trim() || null,
            });

        if (studentError) {
          throw studentError;
        }
      }

      // 4. Create community profile
      if (role === "community") {
        const { error: communityError } =
          await supabase
            .from("community_profiles")
            .insert({
              id: userId,
              community_name: communityName.trim(),
              convener_name: convenerName.trim(),
              faculty_coordinator_name:
                facultyCoordinatorName.trim(),
              email: email.trim(),
              phone: phone.trim(),
            });

        if (communityError) {
          throw communityError;
        }
      }

      setSuccess(
        "Account created successfully! 🎉"
      );

      setTimeout(() => {
        if (role === "student") {
          window.location.href = "/student";
        } else {
          window.location.href = "/community";
        }
      }, 800);
    } catch (err: any) {
      setError(
        err.message || "Account creation failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-4 text-2xl text-gray-400 hover:text-gray-700"
        >
          ×
        </button>

        {/* HEADING */}
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-blue-700">
            {isLogin
              ? "Welcome Back"
              : "Join CAMPULSE"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {isLogin
              ? "Login to continue"
              : "Create your CAMPULSE account"}
          </p>
        </div>

        {/* ROLE */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-gray-700">
            Account Type
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setRole("student");
                resetMessages();
              }}
              className={`rounded-xl border px-4 py-3 font-semibold transition ${
                role === "student"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
              }`}
            >
              Student
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("community");
                resetMessages();
              }}
              className={`rounded-xl border px-4 py-3 font-semibold transition ${
                role === "community"
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
              }`}
            >
              Community
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* STUDENT SIGNUP */}
          {!isLogin && role === "student" && (
            <>
              <div>
                <label className="input-label">
                  Full Name
                </label>

                <input
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  placeholder="Name as in ID card"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">
                  Department
                </label>

                <input
                  value={department}
                  onChange={(e) =>
                    setDepartment(e.target.value)
                  }
                  placeholder="Eg: CSE"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">
                  Semester
                </label>

                <select
                  value={semester}
                  onChange={(e) =>
                    setSemester(e.target.value)
                  }
                  className="input-field"
                >
                  <option value="">
                    Select semester
                  </option>

                  {[1, 2, 3, 4, 5, 6, 7, 8].map(
                    (sem) => (
                      <option
                        key={sem}
                        value={sem}
                      >
                        Semester {sem}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="input-label">
                  Phone Number
                </label>

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  placeholder="10 digit phone number"
                  inputMode="numeric"
                  maxLength={10}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">
                  LinkedIn URL{" "}
                  <span className="text-gray-400">
                    (Optional)
                  </span>
                </label>

                <input
                  value={linkedinUrl}
                  onChange={(e) =>
                    setLinkedinUrl(e.target.value)
                  }
                  placeholder="https://linkedin.com/in/..."
                  className="input-field"
                />
              </div>
            </>
          )}

          {/* COMMUNITY SIGNUP */}
          {!isLogin && role === "community" && (
            <>
              <div>
                <label className="input-label">
                  Community Name
                </label>

                <input
                  value={communityName}
                  onChange={(e) =>
                    setCommunityName(e.target.value)
                  }
                  placeholder="Eg: IEEE"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">
                  Convener Name
                </label>

                <input
                  value={convenerName}
                  onChange={(e) =>
                    setConvenerName(e.target.value)
                  }
                  placeholder="Convener name"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">
                  Faculty Coordinator Name
                </label>

                <input
                  value={facultyCoordinatorName}
                  onChange={(e) =>
                    setFacultyCoordinatorName(
                      e.target.value
                    )
                  }
                  placeholder="Faculty coordinator name"
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">
                  Phone Number
                </label>

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  placeholder="10 digit phone number"
                  inputMode="numeric"
                  maxLength={10}
                  className="input-field"
                />
              </div>
            </>
          )}

          {/* EMAIL */}
          <div>
            <label className="input-label">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="your@email.com"
              className="input-field"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="input-label">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Minimum 6 characters"
              minLength={6}
              className="input-field"
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              {success}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login"
              : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}