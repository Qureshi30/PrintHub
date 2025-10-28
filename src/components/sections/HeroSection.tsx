import { useEffect, useState } from "react";

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center bg-background overflow-hidden">
      {/* Subtle Animated Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary rounded-full animate-float"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-primary rounded-full animate-bounce-gentle"></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-primary rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-primary rounded-full animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Hero Content */}
      <div className={`relative z-10 text-center max-w-4xl mx-auto px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
        <h1 className="text-6xl md:text-8xl font-bold text-blue-600 mb-6 animate-glow">
          PrintHub
        </h1>

        <p className={`text-xl md:text-3xl font-semibold mb-8 max-w-2xl mx-auto transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
          <span className="relative inline-block">
            <span
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient-x font-bold"
              style={{ backgroundSize: '200% auto' }}
            >
              Nobody prints it better.
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 blur-xl animate-pulse"></span>
          </span>
        </p>
      </div>

      {/* Decorative Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none"></div>
    </section>
  );
}