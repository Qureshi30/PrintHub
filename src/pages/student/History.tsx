import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MobileSidebar from "@/components/layout/MobileSidebar";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { RefundStatus } from "@/components/RefundStatus";
import { useUser } from "@clerk/clerk-react";
import { useUserPrintJobs } from "@/hooks/useDatabase";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileCard, MobileTouchButton } from "@/components/mobile/MobileComponents";
import { FileText, Calendar, Printer, Filter, Download, Trash2, Eye } from "lucide-react";

// Match the PrintJob type from useDatabase hook
interface PrintJobType {
  _id: string;
  clerkUserId: string;
  printerId: string | { name?: string };
  file: {
    cloudinaryUrl: string;
    publicId: string;
    originalName: string;
    format: string;
    sizeKB: number;
  };
  settings: {
    pages: string;
    copies: number;
    color: boolean;
    duplex: boolean;
    paperType: string;
  };
  status: 'queued' | 'printing' | 'completed' | 'failed' | 'cancelled';
  queuePosition?: number;
  estimatedCompletionTime?: string;
  pricing: {
    costPerPage: number;
    colorSurcharge: number;
    paperTypeSurcharge: number;
    totalCost: number;
    currency: string;
  };
  payment: {
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    method: string;
    transactionId?: string;
    paidAt?: string;
  };
  timing: {
    submittedAt: string;
    startedAt?: string;
    completedAt?: string;
    totalProcessingTime?: number;
    misprint: boolean;
    reprintCount: number;
    createdAt: string;
    updatedAt: string;
  };
}

function History() {
  const { user } = useUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: printJobs, isLoading } = useUserPrintJobs(user?.id, { limit: 50 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading print history...</div>
        </div>
      </div>
    );
  }

  const jobs = printJobs || [];

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

  return (
    <>
      {isMobile ? (
        <>
          <MobileSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
          <MobileHeader 
            title="Print History"
            onMenuClick={() => setIsSidebarOpen(true)}
            rightAction={
              <MobileTouchButton 
                variant="primary" 
                size="sm"
                onClick={() => navigate("/upload")}
              >
                New Job
              </MobileTouchButton>
            }
          />
          
          <div className="px-4 pb-6 space-y-4">
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No print jobs yet</h3>
                <p className="text-muted-foreground mb-6">Your print history will appear here once you submit jobs.</p>
                <MobileTouchButton 
                  variant="primary"
                  onClick={() => navigate("/upload")}
                >
                  Upload Your First Document
                </MobileTouchButton>
              </div>
            ) : (
              jobs.map((job) => {
                const pages = job.settings?.pages === "all"
                  ? 10
                  : parseInt(job.settings.pages.split("-")[1] || "1");

                return (
                  <MobileCard key={job._id} selected={false} className="space-y-3">
                    {/* Job Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground truncate">
                          {job.file?.originalName || "Unknown File"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(job.timing?.submittedAt || new Date())}</span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>

                    {/* Job Details */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Printer:</span>
                        <div className="font-medium text-foreground">
                          {(job.printerId as any)?.name || 'Unknown Printer'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pages:</span>
                        <div className="font-medium text-foreground">{pages} pages</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Copies:</span>
                        <div className="font-medium text-foreground">{job.settings?.copies || 1}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cost:</span>
                        <div className="font-medium text-green-600 dark:text-green-400">
                          ₹{job.pricing?.totalCost?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Payment:</span>
                        <Badge variant={job.payment?.status === 'paid' ? 'default' : 'secondary'}>
                          {job.payment?.status || 'pending'}
                        </Badge>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {job.status === 'completed' && (
                          <MobileTouchButton
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(job.file?.cloudinaryUrl, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </MobileTouchButton>
                        )}
                        <MobileTouchButton
                          variant="ghost"
                          size="sm"
                          onClick={() => {/* Add view details functionality */}}
                        >
                          <Eye className="h-4 w-4" />
                        </MobileTouchButton>
                      </div>
                    </div>

                    {/* Refund Status for failed jobs */}
                    {job.status === 'failed' && job.payment?.status === 'paid' && (
                      <div className="pt-2 border-t">
                        <RefundStatus 
                          jobId={job._id}
                          trigger={
                            <MobileTouchButton
                              variant="secondary"
                              size="sm"
                              className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 w-full"
                            >
                              Request Refund
                            </MobileTouchButton>
                          }
                        />
                      </div>
                    )}
                  </MobileCard>
                );
              })
            )}
          </div>
        </>
      ) : (
        <>
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
                {jobs.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No print jobs found</h3>
                      <p className="text-muted-foreground mb-4">Start printing to see your job history here</p>
                      <Button onClick={() => navigate("/upload")} className="bg-gradient-hero">
                        Start Printing
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  jobs.map((job) => {
                    const pages = job.settings?.pages === "all"
                      ? 10
                      : parseInt(job.settings.pages.split("-")[1] || "1");

                    return (
                      <Card key={job._id} className="p-6 hover:shadow-lg transition-shadow">
                        <CardContent className="p-0 space-y-4">
                          {/* Job Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-foreground truncate">
                                  {job.file?.originalName || "Unknown File"}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(job.timing?.submittedAt || new Date())}</span>
                                </div>
                              </div>
                            </div>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>

                          {/* Job Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Printer:</span>
                              <div className="font-medium text-foreground">
                                {(job.printerId as any)?.name || 'Unknown Printer'}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Pages:</span>
                              <div className="font-medium text-foreground">{pages} pages</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Copies:</span>
                              <div className="font-medium text-foreground">{job.settings?.copies || 1}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Cost:</span>
                              <div className="font-medium text-green-600">
                                ₹{job.pricing?.totalCost?.toFixed(2) || '0.00'}
                              </div>
                            </div>
                          </div>

                          {/* Payment Status and Actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Payment:</span>
                              <Badge variant={job.payment?.status === 'paid' ? 'default' : 'secondary'}>
                                {job.payment?.status || 'pending'}
                              </Badge>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              {job.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(job.file?.cloudinaryUrl, '_blank')}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {/* Add view details functionality */}}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </div>
                          </div>

                          {/* Refund Status for failed jobs */}
                          {job.status === 'failed' && job.payment?.status === 'paid' && (
                            <div className="pt-2 border-t border-border">
                              <RefundStatus 
                                jobId={job._id}
                                trigger={
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Request Refund
                                  </Button>
                                }
                              />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  );
}
