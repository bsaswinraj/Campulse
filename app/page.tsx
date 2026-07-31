import LoadingScreen from "@/components/loading/LoadingScreen";
import Navbar from "@/components/navbar/Navbar";
import Calendar from "@/components/calendar/Calendar";

export default function Home() {
  return (
    <>
      <LoadingScreen />

      <main className="min-h-screen bg-slate-50">
        <Navbar />
        <Calendar />
      </main>
    </>
  );
}