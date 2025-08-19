import { PrinterIcon, Clock, Users, Zap, CheckCircle, XCircle, ArrowRight, Workflow } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function NoQueueWaiting() {
  const traditionalProblems = [
    {
      icon: Clock,
      title: "Long Waiting Times",
      description: "Standing in line for 20-30 minutes just to print a few pages during peak hours."
    },
    {
      icon: Users,
      title: "Crowded Print Areas",
      description: "Congested printing stations with limited space and frustrated students."
    },
    {
      icon: XCircle,
      title: "Printer Unavailability",
      description: "Walking to a printer only to find it's out of order, out of paper, or occupied."
    },
    {
      icon: PrinterIcon,
      title: "Technical Difficulties",
      description: "Dealing with printer jams, formatting issues, and compatibility problems on the spot."
    }
  ];

  const printHubSolutions = [
    {
      icon: Zap,
      title: "Instant Digital Queue",
      description: "Submit your documents digitally and skip the physical line entirely."
    },
    {
      icon: CheckCircle,
      title: "Guaranteed Printing",
      description: "Your documents are processed and printed automatically without your presence."
    },
    {
      icon: Clock,
      title: "Pick Up When Ready",
      description: "Collect your perfectly printed documents when they're ready - no waiting required."
    },
    {
      icon: Workflow,
      title: "Optimized Workflow",
      description: "Our system manages printer workload and routes jobs to available printers automatically."
    }
  ];

  const comparisonData = [
    {
      aspect: "Average Wait Time",
      traditional: "20-45 minutes",
      printHub: "0 minutes",
      improvement: "100% time savings"
    },
    {
      aspect: "Physical Presence Required",
      traditional: "Throughout entire process",
      printHub: "Only for pickup",
      improvement: "95% less presence needed"
    },
    {
      aspect: "Printer Availability Issues",
      traditional: "Frequent (30-40% of attempts)",
      printHub: "Never (automatic routing)",
      improvement: "100% reliability"
    },
    {
      aspect: "Peak Hour Experience",
      traditional: "Stressful and time-consuming",
      printHub: "Same fast service",
      improvement: "Consistent experience"
    }
  ];

  const workflow = [
    {
      step: 1,
      title: "Upload Online",
      description: "Submit your documents from anywhere using our web platform",
      icon: "📱"
    },
    {
      step: 2,
      title: "Automatic Processing",
      description: "Our system queues and processes your job without any waiting",
      icon: "⚡"
    },
    {
      step: 3,
      title: "Smart Routing",
      description: "Jobs are automatically sent to available printers for optimal efficiency",
      icon: "🔄"
    },
    {
      step: 4,
      title: "Ready Notification",
      description: "Get notified when your documents are printed and ready for pickup",
      icon: "🔔"
    },
    {
      step: 5,
      title: "Quick Pickup",
      description: "Collect your documents from the designated location in seconds",
      icon: "📄"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/20 dark:via-orange-950/20 dark:to-yellow-950/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-red-600 to-orange-600 mb-8 shadow-2xl">
              <PrinterIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-6">
              No Queue Waiting
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Say goodbye to traditional printing queues. Our digital workflow eliminates waiting times, 
              crowded areas, and the frustration of occupied or broken printers.
            </p>
          </div>
        </div>
      </div>

      {/* Traditional Problems */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-red-600">Traditional Printing Problems</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The frustrations and time-wasters of conventional printing that we've eliminated.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {traditionalProblems.map((problem, index) => {
              const IconComponent = problem.icon;
              return (
                <Card key={problem.title} className="group hover:shadow-lg transition-all duration-300 border-2 border-red-100 bg-red-50/30">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-red-600" />
                      </div>
                      <CardTitle className="text-xl text-red-700">{problem.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-red-600/80">{problem.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* PrintHub Solutions */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-green-600">PrintHub's Smart Solutions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              How we've revolutionized the printing experience to eliminate every pain point.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {printHubSolutions.map((solution, index) => {
              const IconComponent = solution.icon;
              return (
                <Card key={solution.title} className="group hover:shadow-lg transition-all duration-300 border-2 border-green-100 bg-green-50/30">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-green-600" />
                      </div>
                      <CardTitle className="text-xl text-green-700">{solution.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-green-600/80">{solution.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Before vs After Comparison */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Traditional vs PrintHub Comparison</h2>
            <p className="text-lg text-muted-foreground">
              See the dramatic improvement in your printing experience.
            </p>
          </div>

          <div className="space-y-6">
            {comparisonData.map((item, index) => (
              <Card key={item.aspect} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x">
                    <div className="p-6 bg-gray-50 dark:bg-gray-900/20">
                      <h3 className="font-semibold text-lg mb-2">{item.aspect}</h3>
                    </div>
                    <div className="p-6 bg-red-50/50 dark:bg-red-950/10">
                      <div className="text-sm text-red-600 font-medium mb-1">Traditional Way</div>
                      <div className="text-red-700">{item.traditional}</div>
                    </div>
                    <div className="p-6 bg-green-50/50 dark:bg-green-950/10">
                      <div className="text-sm text-green-600 font-medium mb-1">PrintHub Way</div>
                      <div className="text-green-700">{item.printHub}</div>
                    </div>
                    <div className="p-6 bg-blue-50/50 dark:bg-blue-950/10">
                      <div className="text-sm text-blue-600 font-medium mb-1">Improvement</div>
                      <div className="text-blue-700 font-semibold">{item.improvement}</div>
                    </div>
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
            <h2 className="text-4xl font-bold mb-6">How Our Queue-Free System Works</h2>
            <p className="text-lg text-muted-foreground">
              A streamlined 5-step process that eliminates all waiting and hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {workflow.map((step, index) => (
              <div key={step.step} className="text-center relative">
                {index < workflow.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-orange-300 to-orange-400 z-0">
                    <ArrowRight className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 bg-white dark:bg-gray-900 rounded-full p-0.5" />
                  </div>
                )}
                <div className="relative z-10 mb-6">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20 flex flex-col items-center justify-center mx-auto mb-4 shadow-lg border border-orange-200">
                    <div className="text-4xl mb-2">{step.icon}</div>
                    <div className="text-sm font-bold text-orange-600">Step {step.step}</div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Summary */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Why Students Love Our Queue-Free System</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Time Freedom</h3>
              <p className="text-muted-foreground">
                Submit documents between classes and pick them up when convenient - no more missed lectures due to printing.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Stress-Free Experience</h3>
              <p className="text-muted-foreground">
                No more anxiety about printer availability, long lines, or technical issues right before deadlines.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Guaranteed Results</h3>
              <p className="text-muted-foreground">
                Your documents are printed perfectly every time with our automated quality checks and professional equipment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-red-600 to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Skip the Queue Forever?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students who have already ditched traditional printing queues for our seamless digital experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Start Printing Queue-Free
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
              See How It Works
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
