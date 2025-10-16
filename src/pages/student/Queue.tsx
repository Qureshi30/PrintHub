import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import MobileSidebar from "@/components/layout/MobileSidebar";
import { MobileCard, MobileTouchButton } from "@/components/mobile/MobileComponents";
import { useState } from "react";
import { 
  Clock, 
  FileText, 
  Printer, 
  X, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Plus,
  RefreshCw,
  Timer,
  List,
  Activity
} from "lucide-react";
import { useUserPrintJobs, useCancelPrintJob } from "@/hooks/useDatabase";

export default function Queue() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
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
    cancelJobMutation.mutate(jobId);
  };

  const handleRefresh = () => {
    // Trigger refresh of queue data
    window.location.reload();
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
    const badgeProps = {
      'queued': { variant: "secondary" as const, className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      'printing': { variant: "default" as const, className: "bg-blue-50 text-blue-700 border-blue-200" },
      'completed': { variant: "outline" as const, className: "bg-green-50 text-green-700 border-green-200" },
      'failed': { variant: "destructive" as const, className: "bg-red-50 text-red-700 border-red-200" }
    };
    
    const props = badgeProps[status as keyof typeof badgeProps] || { variant: "outline" as const, className: "" };
    
    return (
      <Badge variant={props.variant} className={props.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getEstimatedTime = () => {
    if (userQueuePosition <= 0) return 'N/A';
    const baseTime = 2; // minutes per job
    return `${userQueuePosition * baseTime} min`;
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        {isMobile && (
          <MobileSidebar 
            open={isSidebarOpen}
            onOpenChange={setIsSidebarOpen}
          />
        )}
        {isMobile ? (
          <>
            <MobileHeader 
              title="Print Queue" 
              onMenuClick={() => setIsSidebarOpen(true)}
            />
            <div className="px-4 py-6 space-y-4">
              <div className="animate-pulse space-y-4">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
                <div className="h-20 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </>
        ) : (
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        )}
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        {isMobile && (
          <MobileSidebar 
            open={isSidebarOpen}
            onOpenChange={setIsSidebarOpen}
          />
        )}
        {isMobile ? (
          <>
            <MobileHeader 
              title="Print Queue" 
              onMenuClick={() => setIsSidebarOpen(true)}
            />
            <div className="px-4 py-6">
              <MobileCard selected={false} className="border-red-200 bg-red-50">
                <div className="text-center text-red-600">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p className="font-medium mb-2">Failed to load queue</p>
                  <p className="text-sm text-red-500 mb-4">Please try again later</p>
                  <MobileTouchButton
                    variant="secondary"
                    size="sm"
                    onClick={handleRefresh}
                    className="bg-red-100 text-red-700 border-red-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </MobileTouchButton>
                </div>
              </MobileCard>
            </div>
          </>
        ) : (
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
        )}
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      {isMobile && (
        <MobileSidebar 
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
        />
      )}
      {isMobile ? (
        <>
          <MobileHeader 
            title="Print Queue"
            onMenuClick={() => setIsSidebarOpen(true)}
            rightAction={
              <MobileTouchButton
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" />
              </MobileTouchButton>
            }
          />
          <div className="px-4 pb-20 space-y-4">
            {/* Queue Status Cards */}
            <div className="grid grid-cols-2 gap-3">
              <MobileCard selected={false} className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="text-center">
                  <div className="p-2 bg-blue-200 rounded-full w-fit mx-auto mb-2">
                    <List className="h-4 w-4 text-blue-700" />
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {userQueuePosition > 0 ? `#${userQueuePosition}` : 'N/A'}
                  </div>
                  <div className="text-xs text-blue-700">Your Position</div>
                </div>
              </MobileCard>
              
              <MobileCard selected={false} className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="text-center">
                  <div className="p-2 bg-green-200 rounded-full w-fit mx-auto mb-2">
                    <Timer className="h-4 w-4 text-green-700" />
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {getEstimatedTime()}
                  </div>
                  <div className="text-xs text-green-700">Est. Wait</div>
                </div>
              </MobileCard>
            </div>

            {/* Quick Stats */}
            <MobileCard selected={false}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">Queue Overview</div>
                <Activity className="h-4 w-4 text-gray-500" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">{currentUserJobs.length}</div>
                  <div className="text-xs text-gray-600">Your Jobs</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {queueJobs.filter(job => job.status === 'printing').length}
                  </div>
                  <div className="text-xs text-gray-600">Printing</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-600">
                    {queueJobs.filter(job => job.status === 'queued').length}
                  </div>
                  <div className="text-xs text-gray-600">In Queue</div>
                </div>
              </div>
            </MobileCard>

            {/* Action Button */}
            <MobileTouchButton
              variant="primary"
              size="lg"
              onClick={() => navigate("/upload")}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Print Job
            </MobileTouchButton>

            {/* Your Jobs Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Print Jobs</h2>
                <Badge variant="outline" className="text-xs">
                  {currentUserJobs.length} jobs
                </Badge>
              </div>

              {currentUserJobs.length === 0 ? (
                <MobileCard selected={false} className="border-dashed border-gray-300">
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-1">No print jobs in queue</p>
                    <p className="text-sm">Upload files to start printing</p>
                  </div>
                </MobileCard>
              ) : (
                currentUserJobs.map((job) => (
                  <MobileCard key={job._id} selected={false}>
                    <div className="space-y-3">
                      {/* Job Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getStatusIcon(job.status)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {job.file?.originalName || 'Document'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {job.settings.pages} pages • {job.settings.copies} copies
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>

                      {/* Job Progress */}
                      {job.status === 'printing' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Printing progress</span>
                            <span className="font-medium">75%</span>
                          </div>
                          <Progress value={75} className="h-2" />
                        </div>
                      )}

                      {/* Job Actions */}
                      {job.status === 'queued' && (
                        <div className="pt-2 border-t">
                          <MobileTouchButton
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCancelJob(job._id)}
                            disabled={cancelJobMutation.isLoading}
                            className="w-full bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel Job
                          </MobileTouchButton>
                        </div>
                      )}

                      {/* Timing Info for Queued Jobs */}
                      {job.status === 'queued' && userQueuePosition > 0 && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Estimated start: {getEstimatedTime()}
                          </div>
                        </div>
                      )}
                    </div>
                  </MobileCard>
                ))
              )}
            </div>

            {/* Global Queue Status */}
            <MobileCard selected={false} className="bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">System Status</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{queueJobs.length}</div>
                    <div className="text-xs text-gray-600">Total Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">3</div>
                    <div className="text-xs text-gray-600">Active Printers</div>
                  </div>
                </div>
              </div>
            </MobileCard>
          </div>
        </>
      ) : (
        /* Desktop Layout */
        <div className="container mx-auto px-4 py-8">
          <PrintFlowBreadcrumb currentStep="queue" />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Print Queue</h1>
            <p className="text-muted-foreground">
              Track your print jobs and see your position in the queue
            </p>
          </div>

          {/* Desktop Queue Status Overview */}
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
                  {getEstimatedTime()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Approximate time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Print Jobs */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Print Jobs</h2>
              <Button variant="outline" onClick={() => navigate("/upload")}>
                <Plus className="h-4 w-4 mr-2" />
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
                <Card key={job._id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <div>
                            <h3 className="font-semibold">{job.file?.originalName || 'Document'}</h3>
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
                            onClick={() => handleCancelJob(job._id)}
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

          {/* Desktop Global Queue Info */}
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
      )}
    </ProtectedRoute>
  );
}
