import { Button } from "@/components/ui/button";
import { Upload, Users } from "lucide-react";
import { useUpload } from "@/context/UploadContext";
import { useEffect, useState } from "react";

export function HeroSection() {
  const { openFileDialog } = useUpload();
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
      <div className={`relative z-10 text-center max-w-4xl mx-auto px-6 transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <h1 className="text-6xl md:text-8xl font-bold text-blue-600 mb-6 animate-glow">
          PrintHub
        </h1>
        
        <p className={`text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto transition-all duration-1000 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          Nobody prints it better.
        </p>

        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <Button 
            onClick={openFileDialog}
            size="lg"
            className="bg-gradient-hero hover:opacity-90 transition-all duration-300 hover:scale-105 hover:shadow-glow px-8 py-3"
          >
            <Upload className="mr-2 h-5 w-5" />
            Schedule Prints
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 px-8 py-3"
          >
            <Users className="mr-2 h-5 w-5" />
            Sign Up
          </Button>
        </div>
      </div>

      {/* Decorative Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none"></div>
    </section>
  );
}