import LoadingScreen from "@/components/loading/LoadingScreen";
import Navbar from "@/components/navbar/Navbar";
import Calendar from "@/components/calendar/Calendar";

export default function Home() {
  return (
    <>
      <LoadingScreen />

      <main className="relative min-h-screen overflow-hidden bg-black">
        {/* =====================================================
            BACKGROUND IMAGE
        ===================================================== */}

        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/home-background.jpg')",
          }}
        />

        {/* =====================================================
            DARK OVERLAY
            Helps the calendar and navbar stand out.
        ===================================================== */}

        <div className="absolute inset-0 bg-black/45" />

        {/* =====================================================
            BLUE ATMOSPHERIC GLOW
        ===================================================== */}

        <div className="pointer-events-none absolute left-1/2 top-[42%] h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[140px]" />

        {/* =====================================================
            BLACK DEPTH SHADOW
        ===================================================== */}

        <div className="pointer-events-none absolute left-1/2 top-[48%] h-[500px] w-[850px] -translate-x-1/2 rounded-full bg-black/60 blur-[100px]" />

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="relative z-10">
          <Navbar />

          {/* Calendar floating area */}

          <section className="relative px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
            <div className="mx-auto max-w-7xl">
              {/* Floating calendar glow */}

              <div className="relative">
                <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-blue-500/20 blur-3xl" />

                <div className="pointer-events-none absolute -inset-3 rounded-[28px] bg-black/60 blur-xl" />

                {/* =================================================
                    CALENDAR
                ================================================= */}

                <div className="relative rounded-[28px] border border-white/20 bg-white/95 shadow-[0_30px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                  <Calendar />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}