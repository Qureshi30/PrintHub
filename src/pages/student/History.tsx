import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { RefundStatus } from "@/components/RefundStatus";
import { useNavigate } from "react-router-dom";
import { FileText, Calendar, Printer, Download, RotateCcw } from "lucide-react";

interface HistoryJob {
  id: string;
  fileName: string;
  printerStation: string;
  pages: number;
  copies: number;
  colorMode: "color" | "blackwhite";
  status: "completed" | "failed" | "cancelled";
  submittedAt: string;
  completedAt?: string;
  cost: number;
}

const mockHistory: HistoryJob[] = [
  {
    id: "1",
    fileName: "Assignment_Final.pdf",
    printerStation: "Library Ground Floor",
    pages: 15,
    copies: 1,
    colorMode: "blackwhite",
    status: "completed",
    submittedAt: "2024-01-15T10:30:00Z",
    completedAt: "2024-01-15T10:45:00Z",
    cost: 7.5
  },
  {
    id: "2",
    fileName: "Report_Draft.docx",
    printerStation: "Computer Lab 1",
    pages: 8,
    copies: 2,
    colorMode: "color",
    status: "completed",
    submittedAt: "2024-01-14T14:20:00Z",
    completedAt: "2024-01-14T14:35:00Z",
    cost: 12.0
  },
  {
    id: "3",
    fileName: "Presentation.pptx",
    printerStation: "Student Center",
    pages: 12,
    copies: 1,
    colorMode: "color",
    status: "failed",
    submittedAt: "2024-01-13T09:15:00Z",
    cost: 0
  },
  {
    id: "4",
    fileName: "Notes.pdf",
    printerStation: "Library Ground Floor",
    pages: 25,
    copies: 1,
    colorMode: "blackwhite",
    status: "cancelled",
    submittedAt: "2024-01-12T16:30:00Z",
    cost: 0
  }
];

export default function History() {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReprint = (job: HistoryJob) => {
    // In a real app, this would pre-fill the print settings with the job's configuration
    navigate("/upload");
  };

  return (
    <ProtectedRoute>
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
              <FileText className="h-4 w-4 mr-2" />
              New Print Job
            </Button>
          </div>

          <div className="grid gap-4">
            {mockHistory.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-semibold">{job.fileName}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Printer className="h-3 w-3" />
                            {job.printerStation}
                          </span>
                          <span>{job.pages} pages</span>
                          <span>{job.copies} copies</span>
                          <span className="capitalize">{job.colorMode}</span>
                          {job.cost > 0 && <span>${job.cost.toFixed(2)}</span>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Submitted: {formatDate(job.submittedAt)}
                          {job.completedAt && (
                            <span className="ml-2">
                              • Completed: {formatDate(job.completedAt)}
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
                            <RefundStatus jobId={job.id} />
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
            ))}
          </div>

          {mockHistory.length === 0 && (
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
    </ProtectedRoute>
  );
}
