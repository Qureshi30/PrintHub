import { History, Download, Calendar, FileText, Search, Filter, BarChart3, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PrintHistory() {
  const historyFeatures = [
    {
      icon: FileText,
      title: "Complete Records",
      description: "Access detailed records of all your print jobs with timestamps and status updates."
    },
    {
      icon: Download,
      title: "Download Reports",
      description: "Export your printing history as PDF or Excel files for expense tracking."
    },
    {
      icon: Search,
      title: "Smart Search",
      description: "Quickly find specific print jobs using advanced search and filtering options."
    },
    {
      icon: BarChart3,
      title: "Usage Analytics",
      description: "Visualize your printing patterns and track spending over time."
    }
  ];

  const sampleHistory = [
    {
      id: "PH-2025-015",
      fileName: "Final Thesis - Chapter 1-5.pdf",
      date: "2025-01-15",
      time: "2:30 PM",
      pages: 85,
      copies: 1,
      cost: "$8.50",
      location: "Main Library",
      status: "Completed",
      type: "Black & White"
    },
    {
      id: "PH-2025-014",
      fileName: "Lab Report - Chemistry.docx",
      date: "2025-01-12",
      time: "10:15 AM",
      pages: 12,
      copies: 2,
      cost: "$2.40",
      location: "Engineering Building",
      status: "Completed",
      type: "Black & White"
    },
    {
      id: "PH-2025-013",
      fileName: "Project Presentation.pptx",
      date: "2025-01-08",
      time: "4:45 PM",
      pages: 24,
      copies: 1,
      cost: "$12.00",
      location: "Student Union",
      status: "Completed",
      type: "Color"
    },
    {
      id: "PH-2025-012",
      fileName: "Assignment Sheets.pdf",
      date: "2025-01-05",
      time: "11:20 AM",
      pages: 8,
      copies: 5,
      cost: "$4.00",
      location: "Business School",
      status: "Completed",
      type: "Black & White"
    },
    {
      id: "PH-2025-011",
      fileName: "Research Paper Draft.docx",
      date: "2024-12-28",
      time: "3:15 PM",
      pages: 15,
      copies: 1,
      cost: "$1.50",
      location: "Main Library",
      status: "Completed",
      type: "Black & White"
    }
  ];

  const monthlyStats = [
    { month: "January 2025", jobs: 8, pages: 156, spent: "$24.50" },
    { month: "December 2024", jobs: 12, pages: 203, spent: "$35.20" },
    { month: "November 2024", jobs: 15, pages: 287, spent: "$42.80" },
    { month: "October 2024", jobs: 9, pages: 134, spent: "$19.90" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800 border-green-200";
      case "Cancelled": return "bg-red-100 text-red-800 border-red-200";
      case "Refunded": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Color": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Black & White": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 mb-8 shadow-2xl">
              <History className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-6">
              Print History
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Access your complete printing history with detailed records, analytics, and downloadable reports. 
              Track your spending and usage patterns over time.
            </p>
          </div>
        </div>
      </div>

      {/* History Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Powerful History Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to track and manage your printing history effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {historyFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-orange-200">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <IconComponent className="w-6 h-6 text-orange-600" />
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

      {/* Monthly Statistics */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Usage Analytics</h2>
            <p className="text-lg text-muted-foreground">
              Track your printing patterns and spending over time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {monthlyStats.map((stat, index) => (
              <Card key={stat.month} className="text-center hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg">{stat.month}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{stat.jobs}</div>
                    <div className="text-sm text-muted-foreground">Print Jobs</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stat.pages}</div>
                    <div className="text-sm text-muted-foreground">Total Pages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stat.spent}</div>
                    <div className="text-sm text-muted-foreground">Amount Spent</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Search Your History</h2>
            <p className="text-lg text-muted-foreground">
              Find specific print jobs quickly with advanced search and filtering.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input 
                  placeholder="Search by file name, job ID, or location..." 
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Sample History Table */}
          <div className="space-y-4">
            {sampleHistory.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                    <div className="lg:col-span-2">
                      <div className="font-semibold text-sm mb-1">{job.fileName}</div>
                      <div className="text-xs text-muted-foreground">ID: {job.id}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-medium">{job.date}</div>
                      <div className="text-xs text-muted-foreground">{job.time}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm">{job.pages} pages × {job.copies}</div>
                      <div className="text-xs text-muted-foreground">{job.location}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm font-semibold text-green-600">{job.cost}</div>
                      <Badge className={`text-xs border ${getTypeColor(job.type)}`}>
                        {job.type}
                      </Badge>
                    </div>
                    
                    <div className="text-center">
                      <Badge className={`border ${getStatusColor(job.status)}`}>
                        {job.status}
                      </Badge>
                      <Button variant="ghost" size="sm" className="ml-2">
                        <Receipt className="w-4 h-4" />
                      </Button>
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Why Track Your History?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Budget Management</h3>
              <p className="text-muted-foreground">
                Track your printing expenses and stay within your budget with detailed spending analytics.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                <Receipt className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Easy Reimbursement</h3>
              <p className="text-muted-foreground">
                Generate detailed reports for expense reimbursement from your school or organization.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Usage Patterns</h3>
              <p className="text-muted-foreground">
                Understand your printing habits and optimize your workflow for better efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-orange-600 to-amber-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Explore Your Print History
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Get insights into your printing patterns and take control of your document management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              View My History
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Download Report
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
