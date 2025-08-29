import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { RefundStatus } from "@/components/RefundStatus";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useUserPrintJobs } from "@/hooks/useDatabase";
import { FileText, Calendar, Printer, Download, RotateCcw } from "lucide-react";

function History() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { data: printJobs, isLoading } = useUserPrintJobs(user?.id, { limit: 50 });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading print history...</div>
        </div>
      </div>
    );
  }

  const jobs = printJobs?.data?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "printing": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReprint = (job: any) => {
    // In a real app, this would pre-fill the print settings with the job's configuration
    navigate("/upload");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-600">
              Print History
            </h1>
            <p className="text-muted-foreground">
              View and manage your past print jobs
            </p>
          </div>
          <Button onClick={() => navigate("/upload")} className="bg-gradient-hero">
            New Print Job
          </Button>
        </div>

        <div className="space-y-4">
          {jobs.map((job) => {
            // Calculate cost
            const pages = job.settings.pages === 'all' ? 10 : parseInt(job.settings.pages.split('-')[1] || '1');
            const cost = pages * job.settings.copies * (job.settings.color ? 0.15 : 0.05);
            
            return (
              <Card key={job._id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-semibold">{job.file.publicId || 'Document'}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Printer className="h-3 w-3" />
                            Printer {job.printerId.substring(0, 8)}
                          </span>
                          <span>{pages} pages</span>
                          <span>{job.settings.copies} copies</span>
                          <span className="capitalize">{job.settings.color ? 'color' : 'black & white'}</span>
                          {cost > 0 && <span>${cost.toFixed(2)}</span>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Submitted: {formatDate(job.createdAt)}
                          {job.status === 'completed' && (
                            <span className="ml-2">
                              • Completed: {formatDate(job.updatedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                      
                      <div className="flex gap-2">
                        {job.status === "completed" && (
                          <>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReprint(job)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {job.status === "failed" && (
                          <div className="flex gap-2">
                            <RefundStatus jobId={job._id} />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReprint(job)}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Retry
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {jobs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No print history yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start printing to see your job history here
                </p>
                <Button onClick={() => navigate("/upload")} className="bg-gradient-hero">
                  Start Printing
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  );
}
