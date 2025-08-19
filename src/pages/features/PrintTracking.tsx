import { RotateCcw, Eye, MapPin, Clock, CheckCircle, AlertCircle, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function PrintTracking() {
  const trackingStages = [
    {
      stage: "Uploaded",
      description: "Document received and queued for processing",
      icon: Package,
      color: "blue"
    },
    {
      stage: "Processing",
      description: "Document being prepared and optimized for printing",
      icon: RotateCcw,
      color: "yellow"
    },
    {
      stage: "Printing",
      description: "Document currently being printed",
      icon: Eye,
      color: "purple"
    },
    {
      stage: "Ready",
      description: "Document printed and ready for pickup",
      icon: CheckCircle,
      color: "green"
    }
  ];

  const realtimeFeatures = [
    {
      icon: Eye,
      title: "Real-time Updates",
      description: "Track your print job status in real-time from submission to completion."
    },
    {
      icon: MapPin,
      title: "Location Tracking",
      description: "Know exactly which printer is handling your job and where to pick it up."
    },
    {
      icon: Clock,
      title: "Time Estimates",
      description: "Get accurate completion time estimates based on current queue status."
    },
    {
      icon: AlertCircle,
      title: "Issue Alerts",
      description: "Immediate notifications if there are any issues with your print job."
    }
  ];

  const sampleJobs = [
    {
      id: "PH-2025-001",
      name: "Research Paper - Final Draft.pdf",
      status: "Ready",
      progress: 100,
      location: "Main Library - 1st Floor",
      estimatedTime: "Ready for pickup",
      priority: "Normal"
    },
    {
      id: "PH-2025-002",
      name: "Assignment Sheets (20 pages).docx",
      status: "Printing",
      progress: 75,
      location: "Student Union - Ground Floor",
      estimatedTime: "5 minutes remaining",
      priority: "High"
    },
    {
      id: "PH-2025-003",
      name: "Lab Report with Graphs.pdf",
      status: "Processing",
      progress: 25,
      location: "Engineering Building - 2nd Floor",
      estimatedTime: "15 minutes",
      priority: "Normal"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ready": return "bg-green-100 text-green-800 border-green-200";
      case "Printing": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Processing": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Uploaded": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800 border-red-200";
      case "Normal": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-red-950/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 mb-8 shadow-2xl">
              <RotateCcw className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
              Print Tracking
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Monitor your print jobs every step of the way. Get real-time updates from the moment 
              you submit until your documents are ready for pickup.
            </p>
          </div>
        </div>
      </div>

      {/* Tracking Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Real-time Tracking Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stay informed at every stage with comprehensive tracking capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {realtimeFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <IconComponent className="w-6 h-6 text-purple-600" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tracking Stages */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Print Job Stages</h2>
            <p className="text-lg text-muted-foreground">
              Follow your document through each stage of the printing process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {trackingStages.map((stage, index) => {
              const IconComponent = stage.icon;
              return (
                <div key={stage.stage} className="text-center relative">
                  {index < trackingStages.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 z-0"></div>
                  )}
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-full bg-${stage.color}-100 dark:bg-${stage.color}-900/20 flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-lg`}>
                      <IconComponent className={`w-8 h-8 text-${stage.color}-600`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{stage.stage}</h3>
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sample Tracking Dashboard */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Live Tracking Dashboard</h2>
            <p className="text-lg text-muted-foreground">
              See how your print jobs appear in real-time.
            </p>
          </div>

          <div className="space-y-6">
            {sampleJobs.map((job) => (
              <Card key={job.id} className="border-2 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{job.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <span>Job ID: {job.id}</span>
                        <span>•</span>
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`border ${getStatusColor(job.status)}`}>
                        {job.status}
                      </Badge>
                      <Badge className={`border ${getPriorityColor(job.priority)}`}>
                        {job.priority} Priority
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Estimated: {job.estimatedTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Why Track Your Print Jobs?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div>
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Save Time</h3>
              <p className="text-muted-foreground">
                Know exactly when your documents will be ready and avoid unnecessary trips.
              </p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Peace of Mind</h3>
              <p className="text-muted-foreground">
                Stay informed about your important documents throughout the process.
              </p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Resolution</h3>
              <p className="text-muted-foreground">
                Get immediately notified of any issues so they can be resolved quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Start Tracking Your Print Jobs
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Never wonder about your document status again. Get complete visibility into every print job.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Track Your Jobs
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
              View Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
