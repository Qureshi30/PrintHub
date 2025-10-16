import { useEffect, useState } from "react";
import MobileSidebar from "@/components/layout/MobileSidebar";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { useUser } from "@clerk/clerk-react";
import { useDashboardStats } from "@/hooks/useDatabase";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function StudentDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useUser();
  const { stats, loading, error, refresh } = useDashboardStats(user?.id);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Default stats if loading or undefined
  const defaultStats = {
    pendingJobs: 0,
    completedJobs: 0,
    totalSpent: 0,
    availablePrinters: 0,
  };

  const displayStats = stats || defaultStats;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading dashboard: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isMobile && (
        <MobileSidebar 
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
        />
      )}
      <MobileHeader 
        title="Dashboard"
        showBackButton={false}
        onMenuClick={() => setIsSidebarOpen(true)}
      />
      <div className="flex-1">
        {/* Dashboard Content */}
        <div className={`space-y-8 p-8 pt-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-blue-600">
              Dashboard
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[{
              title: "Pending Jobs",
              value: displayStats.pendingJobs.toString(),
              change: "Jobs in queue",
              icon: "⏳",
              color: "text-yellow-700 dark:text-yellow-400",
              bgColor: "bg-yellow-50 dark:bg-yellow-900/30",
              borderColor: "border-yellow-200 dark:border-yellow-700"
            },
            {
              title: "Completed Jobs",
              value: displayStats.completedJobs.toString(),
              change: "Successfully printed",
              icon: "✅",
              color: "text-green-700 dark:text-green-400",
              bgColor: "bg-green-50 dark:bg-green-900/30",
              borderColor: "border-green-200 dark:border-green-700"
            },
            {
              title: "Total Spent",
              value: `₹${displayStats.totalSpent.toFixed(2)}`,
              change: "All time total",
              icon: "💰",
              color: "text-blue-700 dark:text-blue-400",
              bgColor: "bg-blue-50 dark:bg-blue-900/30",
              borderColor: "border-blue-200 dark:border-blue-700"
            },
            {
              title: "Available Printers",
              value: displayStats.availablePrinters.toString(),
              change: "Online now",
              icon: "🖨️",
              color: "text-purple-700 dark:text-purple-400",
              bgColor: "bg-purple-50 dark:bg-purple-900/30",
              borderColor: "border-purple-200 dark:border-purple-700"
            }].map((stat, index) => (
              <div
                key={stat.title}
                className={`group relative rounded-xl border-2 ${stat.borderColor} ${stat.bgColor} shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:scale-105`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <h3 className="tracking-tight text-sm font-bold text-gray-700 dark:text-gray-300">{stat.title}</h3>
                    <span className="text-2xl animate-bounce-gentle">{stat.icon}</span>
                  </div>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mt-1">{stat.change}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
