"use client";

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">

        {/* Left Side */}
        <div className="flex items-center gap-4">

          {/* Logo Placeholder */}
          <div className="w-14 h-14 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 flex items-center justify-center text-blue-400 font-semibold text-xs">
            Logo
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-blue-700 tracking-wide">
              CAMPULSE
            </h1>

            <p className="text-gray-500 text-sm italic">
              Unite the Separated
            </p>
          </div>

        </div>

        {/* Right Side */}

        <div className="flex items-center gap-4">

          <button className="px-6 py-2 rounded-lg font-medium text-blue-700 hover:bg-blue-50 transition">
            Login
          </button>

          <button className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-md">
            Sign Up
          </button>

        </div>

      </div>
    </nav>
  );
}