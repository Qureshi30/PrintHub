import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Settings, Printer, Clock, History, FileText } from "lucide-react";

export default function Index() {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const quickActions = [
    {
      title: "Upload Documents",
      description: "Start a new print job",
      icon: Upload,
      action: () => navigate("/upload"),
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Print Settings",
      description: "Configure print options",
      icon: Settings,
      action: () => navigate("/print-settings"),
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Select Printer",
      description: "Choose printer station",
      icon: Printer,
      action: () => navigate("/select-printer"),
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "View Queue",
      description: "Track print progress",
      icon: Clock,
      action: () => navigate("/queue"),
      color: "bg-orange-500 hover:bg-orange-600"
    }
  ];

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <FeaturesSection />
      
      {/* Dashboard Content */}
      <div className={`space-y-8 p-8 pt-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-blue-600">
            Dashboard
          </h2>
        </div>
        
        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.title}
                className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
                onClick={action.action}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} text-white mb-4 transition-transform group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Pending Jobs", value: "2", change: "Jobs in queue", icon: "⏳", color: "text-yellow-600" },
            { title: "Completed Jobs", value: "47", change: "This month", icon: "✅", color: "text-green-600" },
            { title: "Total Spent", value: "$23.50", change: "This semester", icon: "�", color: "text-blue-600" },
            { title: "Available Printers", value: "8", change: "Online now", icon: "�️", color: "text-purple-600" }
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
