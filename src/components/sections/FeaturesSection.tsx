import { 
  Smartphone, 
  Shield, 
  FileText, 
  Workflow, 
  RotateCcw, 
  Cloud, 
  Zap, 
  BarChart3, 
  Clock 
} from "lucide-react";
import { useEffect, useState } from "react";

const features = [
  {
    icon: Smartphone,
    title: "Mobile Ready",
    description: "Request and approve documents from any device."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Encrypted documents with automatic deletion after printing."
  },
  {
    icon: FileText,
    title: "Smart Request System",
    description: "Intuitive forms with auto-fill for common document types."
  },
  {
    icon: Workflow,
    title: "Automated Workflows",
    description: "Documents routed instantly to the right approvers."
  },
  {
    icon: RotateCcw,
    title: "Print Tracking",
    description: "Monitor status from submission to printing to pickup."
  },
  {
    icon: Cloud,
    title: "Cloud Storage",
    description: "Secure storage with version history for all documents."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get your academic materials printed within 24 hours."
  },
  {
    icon: BarChart3,
    title: "Track Everything",
    description: "Monitor all print jobs in real-time via dashboard."
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description: "College materials printed and ready within 24 hours."
  }
];

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);

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
                className={`group relative p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 transition-all duration-700 hover:scale-105 hover-glow bg-gradient-card ${
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