"use client";

import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <h1 className="relative text-6xl md:text-8xl font-extrabold tracking-widest overflow-hidden">
        <span className="text-black">CAMPULSE</span>

        <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-blue-500/60 to-transparent bg-[length:200%_100%] bg-clip-text text-transparent">
          CAMPULSE
        </span>
      </h1>
    </div>
  );
}