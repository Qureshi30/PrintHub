import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { Card, CardContent, } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, User, HelpCircle, Shield } from "lucide-react";

export default function Index() {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
        
        {/* Account & Support Quick Links */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Account & Support</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card 
              className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={() => navigate("/user-settings")}
            >
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-transform group-hover:scale-110">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">User Settings</h4>
                  <p className="text-xs text-muted-foreground">Manage account</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={() => navigate("/support")}
            >
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-transform group-hover:scale-110">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">Help & Support</h4>
                  <p className="text-xs text-muted-foreground">Get assistance</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={() => navigate("/privacy")}
            >
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-teal-500 hover:bg-teal-600 text-white transition-transform group-hover:scale-110">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">Privacy Policy</h4>
                  <p className="text-xs text-muted-foreground">Data protection</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
              onClick={() => navigate("/terms")}
            >
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-500 hover:bg-slate-600 text-white transition-transform group-hover:scale-110">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium">Terms of Service</h4>
                  <p className="text-xs text-muted-foreground">Service agreement</p>
                </div>
              </CardContent>
            </Card>
          </div>
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
