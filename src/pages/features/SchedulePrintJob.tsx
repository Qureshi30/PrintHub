import { Calendar, Clock, MapPin, Bell, CheckCircle, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SchedulePrintJob() {
  const schedulingBenefits = [
    {
      icon: Clock,
      title: "Flexible Timing",
      description: "Schedule your print jobs up to 7 days in advance for maximum convenience."
    },
    {
      icon: MapPin,
      title: "Location Selection",
      description: "Choose your preferred pickup location from multiple campus printing stations."
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Get automated notifications 30 minutes before your scheduled pickup time."
    },
    {
      icon: CheckCircle,
      title: "Guaranteed Readiness",
      description: "Your documents are guaranteed to be ready at your scheduled time."
    }
  ];

  const timeSlots = [
    "8:00 AM - 9:00 AM",
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 1:00 PM",
    "1:00 PM - 2:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
    "4:00 PM - 5:00 PM"
  ];

  const locations = [
    {
      name: "Main Library",
      address: "1st Floor, Near Information Desk",
      availability: "24/7",
      popular: true
    },
    {
      name: "Student Union",
      address: "Ground Floor, Food Court Area",
      availability: "6 AM - 11 PM",
      popular: true
    },
    {
      name: "Engineering Building",
      address: "2nd Floor, Computer Lab Wing",
      availability: "7 AM - 9 PM",
      popular: false
    },
    {
      name: "Business School",
      address: "1st Floor, Main Lobby",
      availability: "8 AM - 8 PM",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-600 to-teal-600 mb-8 shadow-2xl">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-6">
              Schedule Print Jobs
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Plan your printing needs ahead of time. Schedule when and where to pick up your documents 
              for ultimate convenience that fits your busy student life.
            </p>
          </div>
        </div>
      </div>

      {/* Scheduling Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Why Schedule Your Printing?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Take control of your printing schedule and never worry about timing again.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {schedulingBenefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <Card key={benefit.title} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <IconComponent className="w-6 h-6 text-green-600" />
                      </div>
                      <CardTitle className="text-xl">{benefit.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Available Time Slots */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Available Time Slots</h2>
            <p className="text-lg text-muted-foreground">
              Choose from flexible time slots that work with your schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {timeSlots.map((slot, index) => (
              <div
                key={slot}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-200 cursor-pointer hover:border-green-300"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="font-medium">{slot}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pickup Locations */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Pickup Locations</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Convenient locations across campus for easy document pickup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map((location) => (
              <Card key={location.name} className="relative group hover:shadow-lg transition-all duration-300">
                {location.popular && (
                  <div className="absolute -top-3 -right-3">
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-green-600" />
                    {location.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {location.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Available: {location.availability}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">How Scheduling Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Upload Documents</h3>
              <p className="text-muted-foreground">
                Upload your files and configure print settings.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Choose Time & Place</h3>
              <p className="text-muted-foreground">
                Select your preferred pickup time and location.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Get Notified</h3>
              <p className="text-muted-foreground">
                Receive confirmation and reminders about your scheduled job.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Pick Up</h3>
              <p className="text-muted-foreground">
                Collect your perfectly printed documents on time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-green-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Schedule Your Next Print Job
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Never wait in line again. Schedule your printing and pick up when it's convenient for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Schedule Now
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
              View Calendar
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
