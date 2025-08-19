import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Calendar,
  CreditCard,
  HelpCircle
} from "lucide-react";

interface RefundRequest {
  id: string;
  jobId: string;
  fileName: string;
  amount: number;
  reason: string;
  status: "pending" | "processing" | "approved" | "completed" | "rejected";
  requestedAt: string;
  estimatedCompletion?: string;
  completedAt?: string;
  rejectionReason?: string;
  refundMethod: string;
  transactionId?: string;
}

interface RefundStatusProps {
  jobId: string;
  trigger?: React.ReactNode;
}

const mockRefundData: RefundRequest[] = [
  {
    id: "REF-001",
    jobId: "PJ-2024-002",
    fileName: "Report_Draft.docx",
    amount: 2.50,
    reason: "Printer malfunction",
    status: "completed",
    requestedAt: "2024-01-15T13:50:00Z",
    completedAt: "2024-01-17T10:30:00Z",
    refundMethod: "Original payment method",
    transactionId: "TXN-REF-789456"
  },
  {
    id: "REF-002", 
    jobId: "PJ-2024-008",
    fileName: "Assignment_Final.pdf",
    amount: 1.75,
    reason: "Print quality issues",
    status: "processing",
    requestedAt: "2024-01-16T14:20:00Z",
    estimatedCompletion: "2024-01-19T17:00:00Z",
    refundMethod: "UPI"
  },
  {
    id: "REF-003",
    jobId: "PJ-2024-012",
    fileName: "Presentation.pptx",
    amount: 5.00,
    reason: "Cancelled by user",
    status: "rejected",
    requestedAt: "2024-01-17T09:15:00Z",
    rejectionReason: "Job was already printed and collected",
    refundMethod: "Credit Card"
  }
];

export function RefundStatus({ jobId, trigger }: RefundStatusProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Find refund request for this job
  const refundRequest = mockRefundData.find(refund => refund.jobId === jobId);

  const getStatusColor = (status: RefundRequest["status"]) => {
    switch (status) {
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "processing": return "text-blue-600 bg-blue-100";
      case "approved": return "text-green-600 bg-green-100";
      case "completed": return "text-green-600 bg-green-100";
      case "rejected": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: RefundRequest["status"]) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "processing": return <Clock className="h-4 w-4" />;
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getProgressValue = (status: RefundRequest["status"]) => {
    switch (status) {
      case "pending": return 25;
      case "processing": return 50;
      case "approved": return 75;
      case "completed": return 100;
      case "rejected": return 0;
      default: return 0;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getEstimatedDays = (status: RefundRequest["status"]) => {
    switch (status) {
      case "pending": return "1-2 business days";
      case "processing": return "2-3 business days";
      case "approved": return "3-5 business days";
      case "completed": return "Completed";
      case "rejected": return "N/A";
      default: return "Unknown";
    }
  };

  if (!refundRequest) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <DollarSign className="h-4 w-4 mr-2" />
              Refund Status
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Refund Status</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Refund Request</h3>
            <p className="text-muted-foreground">
              No refund request found for job {jobId}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <DollarSign className="h-4 w-4 mr-2" />
            Refund Status
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Refund Status - {refundRequest.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Current Status
                <Badge className={getStatusColor(refundRequest.status)} variant="secondary">
                  {getStatusIcon(refundRequest.status)}
                  <span className="ml-1 capitalize">{refundRequest.status}</span>
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{getProgressValue(refundRequest.status)}%</span>
                  </div>
                  <Progress value={getProgressValue(refundRequest.status)} className="h-2" />
                </div>
                
                {refundRequest.status === "rejected" && refundRequest.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Refund Rejected</p>
                        <p className="text-xs text-red-600 mt-1">{refundRequest.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {refundRequest.status === "completed" && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Refund Completed</p>
                        <p className="text-xs text-green-600 mt-1">
                          Amount has been credited to your {refundRequest.refundMethod}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Refund Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Refund Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Job ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{refundRequest.jobId}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">File Name</label>
                  <p className="text-sm mt-1">{refundRequest.fileName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Refund Amount</label>
                  <p className="text-sm font-semibold mt-1">₹{refundRequest.amount.toFixed(2)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reason</label>
                  <p className="text-sm mt-1">{refundRequest.reason}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Request Date</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(refundRequest.requestedAt)}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Refund Method</label>
                  <div className="flex items-center gap-2 mt-1">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{refundRequest.refundMethod}</span>
                  </div>
                </div>

                {refundRequest.estimatedCompletion && refundRequest.status !== "completed" && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estimated Completion</label>
                    <p className="text-sm mt-1">{formatDate(refundRequest.estimatedCompletion)}</p>
                  </div>
                )}

                {refundRequest.completedAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Completed On</label>
                    <p className="text-sm mt-1">{formatDate(refundRequest.completedAt)}</p>
                  </div>
                )}

                {refundRequest.transactionId && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                    <p className="text-sm font-mono mt-1">{refundRequest.transactionId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Refund Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Refund Requested</p>
                    <p className="text-xs text-muted-foreground">{formatDate(refundRequest.requestedAt)}</p>
                  </div>
                </div>
                
                {(refundRequest.status === "processing" || refundRequest.status === "approved" || refundRequest.status === "completed") && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Under Review</p>
                      <p className="text-xs text-muted-foreground">Being processed by our team</p>
                    </div>
                  </div>
                )}

                {(refundRequest.status === "approved" || refundRequest.status === "completed") && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Approved</p>
                      <p className="text-xs text-muted-foreground">Refund approved and being processed</p>
                    </div>
                  </div>
                )}

                {refundRequest.status === "completed" && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-xs text-muted-foreground">{formatDate(refundRequest.completedAt!)}</p>
                    </div>
                  </div>
                )}

                {refundRequest.status === "rejected" && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Rejected</p>
                      <p className="text-xs text-muted-foreground">{refundRequest.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="text-center">
            <Button variant="outline" size="sm">
              <HelpCircle className="h-4 w-4 mr-2" />
              Need Help?
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Typical refund processing time: {getEstimatedDays(refundRequest.status)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
