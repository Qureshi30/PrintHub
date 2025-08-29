import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Clock, FileText, Printer, X, CheckCircle, AlertCircle, User } from "lucide-react";
import { useUserPrintJobs, useCancelPrintJob } from "@/hooks/useDatabase";

export default function Queue() {
  const navigate = useNavigate();
  const { user } = useUser();
  
  // Use mock hooks
  const { printJobs: queueJobs, loading: isLoading, error } = useUserPrintJobs();
  const cancelJobMutation = useCancelPrintJob();

  // Filter jobs for current user
  const currentUserJobs = queueJobs.filter(job => job.clerkUserId === user?.id);
  
  // Calculate queue position
  const userQueuePosition = queueJobs.findIndex(job =>
    job.clerkUserId === user?.id && (job.status === 'queued' || job.status === 'printing')
  ) + 1;

  const jobsAhead = queueJobs.slice(0, userQueuePosition - 1);
  
  const handleCancelJob = (jobId: string) => {
    cancelJobMutation.mutate();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock className="h-4 w-4" />;
      case 'printing': return <Printer className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued': return <Badge variant="secondary">Queued</Badge>;
      case 'printing': return <Badge variant="default">Printing</Badge>;
      case 'completed': return <Badge variant="outline">Completed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p>Failed to load queue. Please try again later.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <PrintFlowBreadcrumb currentStep="queue" />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Print Queue</h1>
          <p className="text-muted-foreground">
            Track your print jobs and see your position in the queue
          </p>
        </div>

        {/* Queue Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Your Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userQueuePosition > 0 ? `#${userQueuePosition}` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {jobsAhead.length} jobs ahead
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Your Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentUserJobs.length}</div>
              <p className="text-xs text-muted-foreground">
                Total in queue
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Estimated Wait</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userQueuePosition > 0 ? `${userQueuePosition * 2} min` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Approximate time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Print Jobs */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Print Jobs</h2>
            <Button variant="outline" onClick={() => navigate("/upload")}>
              Add New Job
            </Button>
          </div>

          {currentUserJobs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No print jobs in queue</p>
                  <p className="text-sm mt-2">Upload files to start printing</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            currentUserJobs.map((job) => (
              <Card key={job.id} className="overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <div>
                          <h3 className="font-semibold">{job.fileName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {job.settings.pages} pages • {job.settings.copies} copies
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {getStatusBadge(job.status)}
                      
                      {job.status === 'queued' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelJob(job.id)}
                          disabled={cancelJobMutation.isLoading}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {job.status === 'printing' && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Printing progress</span>
                        <span>75%</span>
                      </div>
                      <Progress value={75} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Global Queue Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Global Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{queueJobs.length}</div>
                <p className="text-xs text-muted-foreground">Total Jobs</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {queueJobs.filter(job => job.status === 'printing').length}
                </div>
                <p className="text-xs text-muted-foreground">Printing Now</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {queueJobs.filter(job => job.status === 'queued').length}
                </div>
                <p className="text-xs text-muted-foreground">In Queue</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">3</div>
                <p className="text-xs text-muted-foreground">Active Printers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
