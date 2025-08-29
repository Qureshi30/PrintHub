import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useDashboardStats } from "@/hooks/useDatabase";

export default function StudentDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useUser();
  const { stats } = useDashboardStats(user?.id);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="flex-1">
      {/* Dashboard Content */}
      <div className={`space-y-8 p-8 pt-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-blue-600">
            Dashboard
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              title: "Pending Jobs", 
              value: stats.pendingJobs.toString(), 
              change: "Jobs in queue", 
              icon: "⏳", 
              color: "text-yellow-600" 
            },
            { 
              title: "Completed Jobs", 
              value: stats.completedJobs.toString(), 
              change: "This month", 
              icon: "✅", 
              color: "text-green-600" 
            },
            { 
              title: "Total Spent", 
              value: `$${stats.totalSpent.toFixed(2)}`, 
              change: "This semester", 
              icon: "💰", 
              color: "text-blue-600" 
            },
            { 
              title: "Available Printers", 
              value: stats.availablePrinters.toString(), 
              change: "Online now", 
              icon: "🖨️", 
              color: "text-purple-600" 
            }
          ].map((stat, index) => (
            <div 
              key={stat.title}
              className="group relative rounded-xl border bg-card/50 backdrop-blur-sm text-card-foreground shadow-sm p-6 hover-glow transition-all duration-300 hover:scale-105 bg-gradient-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{stat.title}</h3>
                  <span className="text-2xl animate-bounce-gentle">{stat.icon}</span>
                </div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
