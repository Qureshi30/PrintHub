import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import MobileSidebar from "@/components/layout/MobileSidebar";
import { MobileCard, MobileTouchButton } from "@/components/mobile/MobileComponents";
import { useState, useEffect } from "react";
import { 
  Clock, 
  FileText, 
  Printer, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  RefreshCw,
  Activity,
  MapPin
} from "lucide-react";
import { useUserPrintJobs, useCancelPrintJob } from "@/hooks/useDatabase";

// Extended PrintJob type that includes the cost field from backend
interface ExtendedPrintJob {
  _id: string;
  clerkUserId: string;
  printerId?: {
    _id: string;
    name: string;
    location?: string;
  };
  file?: {
    originalName: string;
  };
  settings?: {
    pages: string;
    copies: number;
    color: boolean;
    paperType: string;
  };
  status: string;
  queuePosition?: number;
  cost?: {
    totalCost: number;
  };
  pricing?: {
    totalCost: number;
  };
  createdAt: string;
}

export default function Queue() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { printJobs: allJobs, loading: isLoading, error } = useUserPrintJobs(user?.id);
  const cancelJobMutation = useCancelPrintJob();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      globalThis.location.reload();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter jobs for current user with active statuses (pending or in-progress only)
  const currentUserJobs = (allJobs as unknown as ExtendedPrintJob[]).filter(
    job => {
      const isUserJob = job.clerkUserId === user?.id;
      const isActiveStatus = ['pending', 'in-progress'].includes(job.status);
      return isUserJob && isActiveStatus;
    }
  );

  // Group jobs by printer
  const jobsByPrinter = currentUserJobs.reduce((acc, job) => {
    // Handle populated printerId (object) or string
    type PopulatedPrinter = { _id: string; name: string; location: string };
    const printer = typeof job.printerId === 'object' && job.printerId !== null 
      ? job.printerId as unknown as PopulatedPrinter
      : null;
    
    const printerId = printer?._id || (typeof job.printerId === 'string' ? job.printerId : 'unknown');
    const printerName = printer?.name || 'Unknown Printer';
    const printerLocation = printer?.location || 'Unknown Location';
    
    if (!acc[printerId]) {
      acc[printerId] = {
        printerName,
        printerLocation,
        jobs: []
      };
    }
    acc[printerId].jobs.push(job);
    return acc;
  }, {} as Record<string, { printerName: string; printerLocation: string; jobs: typeof currentUserJobs }>);

  const handleCancelJob = (jobId: string) => {
    cancelJobMutation.mutate(jobId);
  };

  const handleRefresh = () => {
    globalThis.location.reload();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'queued': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'in-progress': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'printing': return <Printer className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badgeProps = {
      'pending': { variant: "secondary" as const, className: "bg-gray-100 text-gray-700 border-gray-200" },
      'queued': { variant: "secondary" as const, className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      'in-progress': { variant: "default" as const, className: "bg-blue-50 text-blue-700 border-blue-200" },
      'printing': { variant: "default" as const, className: "bg-blue-100 text-blue-800 border-blue-300" },
      'completed': { variant: "outline" as const, className: "bg-green-50 text-green-700 border-green-200" },
      'failed': { variant: "destructive" as const, className: "bg-red-50 text-red-700 border-red-200" }
    };
    
    const props = badgeProps[status as keyof typeof badgeProps] || { variant: "outline" as const, className: "" };
    
    return (
      <Badge variant={props.variant} className={`${props.className} text-xs`}>
        {status.replace('-', ' ').charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </Badge>
    );
  };

  // Calculate estimated wait time based on position in specific printer queue
  const getEstimatedWaitTime = (queuePosition: number, printerSpeed: number = 2) => {
    if (queuePosition <= 1) return '< 1 min';
    const minutes = queuePosition * printerSpeed;
    if (minutes < 60) return `~${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `~${hours}h ${mins}m`;
  };

  if (!isLoaded || isLoading) {
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
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </div>
          </>
        ) : (
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
              <MobileCard selected={false} className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                <div className="text-center text-red-600 dark:text-red-400">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p className="font-medium mb-2">Failed to load queue</p>
                  <p className="text-sm text-red-500 dark:text-red-400 mb-4">Please try again later</p>
                  <MobileTouchButton
                    variant="secondary"
                    size="sm"
                    onClick={handleRefresh}
                    className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900"
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
            <Card className="border-red-200 dark:border-red-900 dark:bg-gray-800">
              <CardContent className="pt-6">
                <div className="text-center text-red-600 dark:text-red-400">
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
            title="My Print Jobs"
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
            {/* Summary Card */}
            <MobileCard selected={false} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-2xl font-bold text-blue-900">{currentUserJobs.length}</div>
                  <div className="text-sm text-blue-700">Active Print Jobs</div>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-xs text-blue-600">
                Jobs are processed concurrently across multiple printers
              </div>
            </MobileCard>

            {/* Add New Job Button */}
            <MobileTouchButton
              variant="primary"
              size="lg"
              onClick={() => navigate("/upload")}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Print Job
            </MobileTouchButton>

            {/* Jobs Grouped by Printer */}
            <div className="space-y-4">
              {Object.keys(jobsByPrinter).length === 0 ? (
                <MobileCard selected={false} className="border-dashed border-gray-300">
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-1">No active print jobs</p>
                    <p className="text-sm">Upload files to start printing</p>
                  </div>
                </MobileCard>
              ) : (
                Object.entries(jobsByPrinter).map(([printerId, { printerName, printerLocation, jobs }]) => (
                  <div key={printerId} className="space-y-2">
                    {/* Printer Header */}
                    <div className="flex items-center gap-2 px-2">
                      <Printer className="h-4 w-4 text-gray-600" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{printerName}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {printerLocation}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                      </Badge>
                    </div>

                    {/* Jobs for this Printer */}
                    {jobs.map((job, index) => (
                      <MobileCard key={job._id} selected={false}>
                        <div className="space-y-3">
                          {/* Job Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getStatusIcon(job.status)}
                              <div className="min-w-0 flex-1">
                                <div className="font-medium truncate text-sm">
                                  {job.file?.originalName || 'Document'}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {job.settings?.pages || 'N/A'} pages • {job.settings?.copies || 1} {job.settings?.copies === 1 ? 'copy' : 'copies'}
                                </div>
                              </div>
                            </div>
                            {getStatusBadge(job.status)}
                          </div>

                          {/* Queue Position & Wait Time */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-blue-50 p-2 rounded">
                              <div className="text-gray-600 mb-1">Position in Queue</div>
                              <div className="font-bold text-blue-900">#{index + 1}</div>
                            </div>
                            <div className="bg-green-50 p-2 rounded">
                              <div className="text-gray-600 mb-1">Est. Wait Time</div>
                              <div className="font-bold text-green-900">
                                {getEstimatedWaitTime(index + 1)}
                              </div>
                            </div>
                          </div>

                          {/* Job Details */}
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>Paper Type:</span>
                              <span className="font-medium">{job.settings?.paperType || 'A4'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Color Mode:</span>
                              <span className="font-medium">{job.settings?.color ? 'Color' : 'B&W'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Cost:</span>
                              <span className="font-medium">₹{(job.cost?.totalCost || job.pricing?.totalCost || 0).toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Cancel Action */}
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
                        </div>
                      </MobileCard>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        /* Desktop Layout */
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">My Print Jobs</h1>
                <p className="text-muted-foreground">
                  Track your print jobs across multiple printers
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={() => navigate("/upload")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Job
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl font-bold mb-1">{currentUserJobs.length}</div>
                  <div className="text-muted-foreground">Active Print Jobs</div>
                </div>
                <Activity className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                Jobs are processed concurrently across multiple printers for faster service
              </div>
            </CardContent>
          </Card>

          {/* Jobs Grouped by Printer */}
          <div className="space-y-6">
            {Object.keys(jobsByPrinter).length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2 dark:text-gray-300">No active print jobs</p>
                    <p className="text-sm mb-4 dark:text-gray-400">Upload files to start printing</p>
                    <Button onClick={() => navigate("/upload")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Job
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              Object.entries(jobsByPrinter).map(([printerId, { printerName, printerLocation, jobs }]) => (
                <Card key={printerId}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 dark:text-gray-100">
                      <Printer className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <div className="flex-1">
                        <div className="text-lg dark:text-gray-100">{printerName}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                          <MapPin className="h-3 w-3" />
                          {printerLocation}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {jobs.map((job, index) => (
                        <Card key={job._id} className="border shadow-sm">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="mt-1">
                                  {getStatusIcon(job.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold truncate mb-1 dark:text-gray-100">
                                    {job.file?.originalName || 'Document'}
                                  </h3>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                                    <div>
                                      <span className="font-medium">Pages:</span> {job.settings?.pages || 'N/A'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Copies:</span> {job.settings?.copies || 1}
                                    </div>
                                    <div>
                                      <span className="font-medium">Color:</span> {job.settings?.color ? 'Yes' : 'B&W'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Cost:</span> ₹{(job.cost?.totalCost || job.pricing?.totalCost || 0).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {getStatusBadge(job.status)}
                                {job.status === 'queued' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancelJob(job._id)}
                                    disabled={cancelJobMutation.isLoading}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Queue Position & Wait Time */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <div className="text-xs text-muted-foreground mb-1">Position in Queue</div>
                                <div className="text-xl font-bold">#{index + 1}</div>
                              </div>
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <div className="text-xs text-muted-foreground mb-1">Estimated Wait Time</div>
                                <div className="text-xl font-bold">
                                  {getEstimatedWaitTime(index + 1)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
