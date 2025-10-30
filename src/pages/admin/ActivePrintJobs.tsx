import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/apiClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";
import { AdminMobileSidebar } from "@/components/admin/AdminMobileSidebar";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Printer, 
  Clock, 
  XCircle,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Info,
  MapPin
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface PrintJob {
  _id: string;
  clerkUserId: string;
  userName?: string;
  userEmail?: string;
  printerId?: {
    _id: string;
    name: string;
    location: string;
    status: string;
  };
  file: {
    originalName: string;
    format: string;
    sizeKB: number;
  };
  settings: {
    copies: number;
    color: boolean;
    duplex: boolean;
    paperType: string;
  };
  status: string;
  priority: string;
  queuePosition?: number;
  cost: {
    totalCost: number;
  };
  payment: {
    status: string;
    method: string;
    refundStatus?: string;
  };
  timing: {
    submittedAt: string;
    startedAt?: string;
    completedAt?: string;
  };
  errorMessage?: string;
}

export default function ActivePrintJobs() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeJobs, setActiveJobs] = useState<PrintJob[]>([]);
  const [terminatedJobs, setTerminatedJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [terminatingJobId, setTerminatingJobId] = useState<string | null>(null);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<PrintJob | null>(null);
  const [terminateReason, setTerminateReason] = useState("");
  const [activeTab, setActiveTab] = useState("active");
  const isMobile = useIsMobile();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const fetchActiveJobs = async () => {
    try {
      const token = await getToken();
      
      // Add small delays between requests to avoid rate limiting
      const statusesToFetch = ['pending', 'queued', 'in-progress', 'printing'];
      const allJobs: PrintJob[] = [];
      
      for (let i = 0; i < statusesToFetch.length; i++) {
        const status = statusesToFetch[i];
        try {
          const response = await apiClient.get('/print-jobs', {
            headers: { Authorization: `Bearer ${token}` },
            params: { status, limit: 100 }
          });
          
          const jobs = response.data?.data?.jobs || [];
          allJobs.push(...jobs);
          
          // Small delay between requests (except for the last one)
          if (i < statusesToFetch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (err) {
          console.error(`Error fetching ${status} jobs:`, err);
        }
      }

      // Filter out any null/undefined jobs
      const validJobs = allJobs.filter((job): job is PrintJob => job != null && job._id != null);
      setActiveJobs(validJobs);
    } catch (error) {
      console.error('Error fetching active jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch active print jobs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTerminatedJobs = async () => {
    try {
      const token = await getToken();
      const response = await apiClient.get('/admin/printjobs/terminated', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const jobs = response.data.data.jobs || [];
        // Filter out any null/undefined jobs
        const validJobs = jobs.filter((job: PrintJob) => job != null && job._id != null);
        setTerminatedJobs(validJobs);
      }
    } catch (error) {
      console.error('Error fetching terminated jobs:', error);
    }
  };

  useEffect(() => {
    fetchActiveJobs();
    fetchTerminatedJobs();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchActiveJobs();
      fetchTerminatedJobs();
    }, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch on mount

  const handleTerminateClick = (job: PrintJob) => {
    setSelectedJob(job);
    setTerminateReason("");
    setShowTerminateDialog(true);
  };

  const handleTerminateConfirm = async () => {
    if (!selectedJob) return;

    setTerminatingJobId(selectedJob._id);
    setShowTerminateDialog(false);

    try {
      const token = await getToken();
      const response = await apiClient.delete(
        `/admin/printjobs/${selectedJob._id}/terminate`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { reason: terminateReason }
        }
      );

      if (response.data.success) {
        toast({
          title: "✅ Job Terminated",
          description: `Print job "${selectedJob.file.originalName}" has been terminated and refund initiated.`,
        });

        // Remove from active jobs and refresh
        setActiveJobs(prev => prev.filter(job => job._id !== selectedJob._id));
        fetchTerminatedJobs();
      }
    } catch (error: unknown) {
      console.error('Error terminating job:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message 
        : undefined;
      
      toast({
        title: "❌ Termination Failed",
        description: errorMessage || "Failed to terminate print job",
        variant: "destructive"
      });
    } finally {
      setTerminatingJobId(null);
      setSelectedJob(null);
      setTerminateReason("");
    }
  };

  const getStatusBadge = (status: string) => {
    type IconType = React.ComponentType<{ className?: string }>;
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: IconType }> = {
      pending: { variant: "secondary", icon: Clock },
      queued: { variant: "default", icon: Clock },
      "in-progress": { variant: "default", icon: Loader2 },
      printing: { variant: "default", icon: Printer },
      completed: { variant: "outline", icon: CheckCircle },
      terminated: { variant: "destructive", icon: XCircle },
      failed: { variant: "destructive", icon: AlertTriangle }
    };

    const config = statusConfig[status] || { variant: "secondary", icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFirstName = (fullName?: string) => {
    if (!fullName) return null;
    // Extract first name from full name (e.g., "John Doe" -> "John")
    return fullName.split(' ')[0];
  };

  const renderJobCard = (job: PrintJob, showTerminateButton: boolean = true) => {
    // Safety check
    if (!job || !job._id) return null;
    
    return (
    <Card key={job._id} className={terminatingJobId === job._id ? "opacity-50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{job.file?.originalName || 'Unknown File'}</span>
              {getStatusBadge(job.status)}
              {job.priority === 'high' && (
                <Badge variant="destructive" className="text-xs">HIGH PRIORITY</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>
                <strong>User:</strong> {getFirstName(job.userName) || job.userEmail || job.clerkUserId?.slice(0, 10) || 'Unknown'}
              </div>
              <div>
                <strong>Copies:</strong> {job.settings?.copies || 1} | {job.settings?.color ? 'Color' : 'B&W'}
              </div>
              <div className="flex items-center gap-1">
                <Printer className="h-3 w-3" />
                <span><strong>Printer:</strong> {job.printerId?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span><strong>Location:</strong> {job.printerId?.location || 'N/A'}</span>
              </div>
              <div>
                <strong>Paper:</strong> {job.settings?.paperType || 'N/A'}
              </div>
              <div>
                <strong>Cost:</strong> ₹{job.cost?.totalCost?.toFixed(2) || '0.00'}
              </div>
              {job.queuePosition && (
                <div>
                  <strong>Queue Position:</strong> {job.queuePosition}
                </div>
              )}
              <div>
                <strong>Submitted:</strong> {job.timing?.submittedAt ? formatDate(job.timing.submittedAt) : 'N/A'}
              </div>
            </div>

            {job.errorMessage && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <span>{job.errorMessage}</span>
              </div>
            )}

            {job.payment?.refundStatus && job.payment.refundStatus !== 'none' && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="bg-blue-50">
                  Refund: {job.payment.refundStatus}
                </Badge>
              </div>
            )}
          </div>

          {showTerminateButton && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleTerminateClick(job)}
              disabled={terminatingJobId === job._id}
              className="shrink-0"
            >
              {terminatingJobId === job._id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Terminating...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Terminate
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );};

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <AdminMobileSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
        
        <AdminMobileHeader 
          title="Active Print Jobs"
          subtitle="Manage and terminate print jobs"
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        <div className="p-4 pb-20 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Active ({activeJobs.length})
              </TabsTrigger>
              <TabsTrigger value="terminated">
                Terminated ({terminatedJobs.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 mt-4">
              {loading ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading print jobs...</p>
                  </CardContent>
                </Card>
              ) : activeJobs.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="font-medium">No active print jobs</p>
                    <p className="text-sm text-muted-foreground">All jobs are completed or terminated</p>
                  </CardContent>
                </Card>
              ) : (
                activeJobs.filter(job => job != null).map(job => renderJobCard(job))
              )}
            </TabsContent>

            <TabsContent value="terminated" className="space-y-4 mt-4">
              {terminatedJobs.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Info className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="font-medium">No terminated jobs</p>
                    <p className="text-sm text-muted-foreground">No jobs have been terminated yet</p>
                  </CardContent>
                </Card>
              ) : (
                terminatedJobs.filter(job => job != null).map(job => renderJobCard(job, false))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <AlertDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Terminate Print Job?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  Are you sure you want to terminate the print job <strong>"{selectedJob?.file.originalName}"</strong>?
                </p>
                <p className="text-sm">
                  This will:
                </p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Stop the print job immediately</li>
                  <li>Remove it from the queue</li>
                  <li>Initiate a refund of ₹{selectedJob?.cost.totalCost.toFixed(2)}</li>
                  <li>Notify the user</li>
                </ul>
                
                <div className="space-y-2">
                  <label htmlFor="terminate-reason" className="text-sm font-medium">Reason (optional):</label>
                  <Textarea
                    id="terminate-reason"
                    placeholder="Enter reason for termination..."
                    value={terminateReason}
                    onChange={(e) => setTerminateReason(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleTerminateConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Terminate Job
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Active Print Jobs</h1>
          <p className="text-muted-foreground">Manage and terminate ongoing print jobs</p>
        </div>
        <Button onClick={() => { fetchActiveJobs(); fetchTerminatedJobs(); }} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active Jobs ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="terminated">
            Terminated Jobs ({terminatedJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading print jobs...</p>
              </CardContent>
            </Card>
          ) : activeJobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-xl font-medium mb-2">No active print jobs</p>
                <p className="text-muted-foreground">All jobs are completed or terminated</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeJobs.filter(job => job != null).map(job => renderJobCard(job))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="terminated" className="space-y-4 mt-6">
          {terminatedJobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Info className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-medium mb-2">No terminated jobs</p>
                <p className="text-muted-foreground">No jobs have been terminated yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {terminatedJobs.filter(job => job != null).map(job => renderJobCard(job, false))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Print Job?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate the print job "{selectedJob?.file.originalName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">This will:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Stop the print job immediately</li>
                <li>Remove it from the queue</li>
                <li>Initiate a refund of ₹{selectedJob?.cost.totalCost.toFixed(2)}</li>
                <li>Notify the user</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="terminate-reason-desktop" className="text-sm font-medium">Reason (optional):</label>
              <Textarea
                id="terminate-reason-desktop"
                placeholder="Enter reason for termination..."
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminateConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Terminate Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
