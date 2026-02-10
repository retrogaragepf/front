import Sidebar from "@/src/components/dashboard/Sidebar";
import StatsGrid from "@/src/components/dashboard/StatsGrid";
import ProfileHeader from "@/src/components/dashboard/ProfileHeader";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-amber-200">
      <Sidebar />

      <main className="flex-1 p-10 space-y-10">
        <ProfileHeader />

        <StatsGrid />
      </main>
    </div>
  );
}
