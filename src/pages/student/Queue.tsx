import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { PrintFlowBreadcrumb } from "@/components/ui/print-flow-breadcrumb";
import { useNavigate } from "react-router-dom";
import { Clock, FileText, Printer, X, CheckCircle, AlertCircle, User } from "lucide-react";

interface QueueJob {
  id: string;
  fileName: string;
  userName: string;
  pages: number;
  copies: number;
  colorMode: "color" | "blackwhite";
  status: "printing" | "pending" | "completed" | "failed";
  estimatedTime: number; // in minutes
  submittedAt: string;
}

const mockQueue: QueueJob[] = [
  {
    id: "1",
    fileName: "Assignment_Final.pdf",
    userName: "Current User",
    pages: 15,
    copies: 1,
    colorMode: "blackwhite",
    status: "printing",
    estimatedTime: 3,
    submittedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    fileName: "Report_Draft.docx",
    userName: "John Doe",
    pages: 8,
    copies: 2,
    colorMode: "color",
    status: "pending",
    estimatedTime: 5,
    submittedAt: "2024-01-15T10:25:00Z"
  },
  {
    id: "3",
    fileName: "Presentation.pptx",
    userName: "Jane Smith",
    pages: 12,
    copies: 1,
    colorMode: "color",
    status: "pending",
    estimatedTime: 8,
    submittedAt: "2024-01-15T10:20:00Z"
  }
];

export default function Queue() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueJob[]>(mockQueue);
  const [currentUserJob, setCurrentUserJob] = useState<QueueJob | null>(
    queue.find(job => job.userName === "Current User") || null
  );

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate queue progression
      setQueue(prevQueue => 
        prevQueue.map(job => ({
          ...job,
          estimatedTime: Math.max(0, job.estimatedTime - 0.1)
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "printing": return <Printer className="h-4 w-4 text-blue-600" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed": return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "printing": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const userPosition = queue.findIndex(job => job.userName === "Current User") + 1;
  const totalEstimatedTime = queue
    .slice(0, userPosition)
    .reduce((total, job) => total + job.estimatedTime, 0);

  const handleCancel = () => {
    // Cancel the current user's job
    setQueue(prev => prev.filter(job => job.userName !== "Current User"));
    setCurrentUserJob(null);
    navigate("/upload");
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <PrintFlowBreadcrumb currentStep="/queue" />
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-blue-600">
              Print Queue
            </h1>
            <p className="text-muted-foreground">
              Track your print job progress
            </p>
          </div>

          {/* Current User's Job Status */}
          {currentUserJob && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Your Print Job
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Position</div>
                    <div className="text-2xl font-bold text-blue-600">#{userPosition}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Estimated Wait</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.ceil(totalEstimatedTime)}m
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge className={getStatusColor(currentUserJob.status)}>
                      {getStatusIcon(currentUserJob.status)}
                      {currentUserJob.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Progress</div>
                    <Progress 
                      value={currentUserJob.status === "printing" ? 75 : 25} 
                      className="h-2 mt-2" 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <div className="font-medium">{currentUserJob.fileName}</div>
                    <div className="text-sm text-muted-foreground">
                      {currentUserJob.pages} pages • {currentUserJob.copies} copies • {currentUserJob.colorMode}
                    </div>
                  </div>
                  {currentUserJob.status === "pending" && (
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Queue Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Queue Overview - Library Ground Floor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queue.map((job, index) => (
                  <div 
                    key={job.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      job.userName === "Current User" ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{job.fileName}</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {job.userName}
                          </span>
                          <span>{job.pages} pages</span>
                          <span>{job.copies} copies</span>
                          <span className="capitalize">{job.colorMode}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge className={getStatusColor(job.status)}>
                          {getStatusIcon(job.status)}
                          {job.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          ~{Math.ceil(job.estimatedTime)}m
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/upload")} className="flex-1">
              Print Another Document
            </Button>
            <Button onClick={() => navigate("/history")} className="flex-1 bg-gradient-hero">
              View History
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
