import { 
  Shield, 
  Calendar, 
  RotateCcw, 
  History, 
  Bell, 
  PrinterIcon 
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Encrypted documents with automatic deletion after printing for maximum security.",
    path: "/features/security-privacy"
  },
  {
    icon: Calendar,
    title: "Schedule Print Job",
    description: "Schedule your print jobs for convenient pickup times that fit your schedule.",
    path: "/features/schedule-print-job"
  },
  {
    icon: RotateCcw,
    title: "Print Tracking",
    description: "Monitor status from submission to printing to pickup in real-time.",
    path: "/features/print-tracking"
  },
  {
    icon: History,
    title: "Print History",
    description: "Access your complete printing history with detailed records and receipts.",
    path: "/features/print-history"
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Get instant alerts for print job status updates and pickup reminders.",
    path: "/features/notifications"
  },
  {
    icon: PrinterIcon,
    title: "No Queue Waiting",
    description: "Skip traditional printing queues with our efficient digital workflow system.",
    path: "/features/no-queue-waiting"
  }
];

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  const handleFeatureClick = (path: string) => {
    navigate(path);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('features-section');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="features-section"
      className="py-20 px-6 bg-background relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary))_1px,transparent_1px)] bg-[length:50px_50px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-blue-600">
            Why Choose PrintHub?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the future of document printing with our comprehensive suite of features designed for modern needs.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.title}
                onClick={() => handleFeatureClick(feature.path)}
                className={`group relative p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 transition-all duration-700 hover:scale-105 hover-glow bg-gradient-card cursor-pointer ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  transitionDelay: `${index * 100}ms`
                }}
              >
                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300"></div>
                
                <div className="relative">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-xl bg-gradient-hero flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-glow">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-hero opacity-5 rounded-bl-full"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}