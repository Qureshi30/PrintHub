import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiClient } from "@/lib/apiClient";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  Printer,
} from "lucide-react";

interface PrinterError {
  _id: string;
  printerName: string;
  printerId?: {
    _id: string;
    name: string;
    location: string;
    model: string;
  };
  errorType: string;
  description: string;
  status: 'unresolved' | 'in_progress' | 'resolved' | 'ignored';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  metadata?: {
    location?: string;
    ipAddress?: string;
    errorCode?: string;
    affectedJobs?: number;
  };
}

interface ErrorStats {
  total: number;
  unresolved: number;
  inProgress: number;
  resolved: number;
}

export default function PrinterErrorLogs() {
  const [errors, setErrors] = useState<PrinterError[]>([]);
  const [stats, setStats] = useState<ErrorStats>({ total: 0, unresolved: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { getToken } = useAuth();

  const fetchErrors = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: 20,
        sortBy: 'timestamp',
        sortOrder: 'desc',
      };

      if (filter !== 'all') {
        params.status = filter;
      }

      if (priorityFilter !== 'all') {
        params.priority = priorityFilter;
      }

      const response = await apiClient.get('/printer-errors', {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setErrors(response.data.data.errors);
        setStats(response.data.data.stats);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching printer errors:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, priorityFilter, currentPage, getToken]);

  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  const updateErrorStatus = async (errorId: string, status: string) => {
    try {
      const token = await getToken();
      
      // Use dedicated endpoints for better functionality
      if (status === 'in_progress') {
        await apiClient.post(
          `/printer-errors/${errorId}/in-progress`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else if (status === 'resolved') {
        // Mark as resolved without prompting for notes
        await apiClient.post(
          `/printer-errors/${errorId}/resolve`,
          { resolvedBy: 'Admin' },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Fallback to generic status update
        await apiClient.patch(
          `/printer-errors/${errorId}/status`,
          { status, resolvedBy: 'Admin' },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      
      fetchErrors();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteError = async (errorId: string) => {
    if (!confirm('Are you sure you want to delete this error log?')) return;
    
    try {
      const token = await getToken();
      await apiClient.delete(`/printer-errors/${errorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchErrors();
    } catch (error) {
      console.error('Error deleting error:', error);
    }
  };

  const markAllAsResolved = async () => {
    if (!confirm('Are you sure you want to mark all errors as resolved?')) return;
    
    try {
      const token = await getToken();
      
      // Get all unresolved and in-progress error IDs
      const unresolvedErrors = errors.filter(
        error => error.status === 'unresolved' || error.status === 'in_progress'
      );
      
      // Mark each error as resolved
      await Promise.all(
        unresolvedErrors.map(error =>
          apiClient.post(
            `/printer-errors/${error._id}/resolve`,
            { resolvedBy: 'Admin' },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );
      
      fetchErrors();
    } catch (error) {
      console.error('Error marking all as resolved:', error);
    }
  };

  const exportToCSV = () => {
    // Create CSV headers
    const headers = [
      'Printer Name',
      'Error Type',
      'Description',
      'Priority',
      'Status',
      'Timestamp',
      'Location',
      'Error Code',
      'Affected Jobs',
      'Resolved At',
      'Resolved By'
    ];

    // Create CSV rows
    const rows = errors.map(error => [
      error.printerName,
      error.errorType,
      error.description.split(',').join(';'), // Replace commas to avoid CSV issues
      error.priority,
      error.status,
      formatTimestamp(error.timestamp),
      error.metadata?.location || '',
      error.metadata?.errorCode || '',
      error.metadata?.affectedJobs?.toString() || '',
      error.resolvedAt ? formatTimestamp(error.resolvedAt) : '',
      error.resolvedBy || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `printer-error-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unresolved': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'ignored': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading && errors.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Printer Error Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage printer errors</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchErrors} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={markAllAsResolved} 
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            disabled={stats.unresolved === 0 && stats.inProgress === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Resolved
          </Button>
          <Button 
            onClick={exportToCSV} 
            variant="outline"
            disabled={errors.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-500">{stats.unresolved}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Fixed successfully</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium dark:text-gray-200">Status:</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'unresolved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unresolved')}
              >
                Unresolved
              </Button>
              <Button
                variant={filter === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('in_progress')}
              >
                In Progress
              </Button>
              <Button
                variant={filter === 'resolved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('resolved')}
              >
                Resolved
              </Button>
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium dark:text-gray-200">Priority:</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={priorityFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriorityFilter('all')}
              >
                All
              </Button>
              <Button
                variant={priorityFilter === 'urgent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriorityFilter('urgent')}
              >
                Urgent
              </Button>
              <Button
                variant={priorityFilter === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriorityFilter('high')}
              >
                High
              </Button>
              <Button
                variant={priorityFilter === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriorityFilter('medium')}
              >
                Medium
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle>Error Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium dark:text-gray-300">No errors found</p>
              <p className="text-sm dark:text-gray-400">All printers are operating normally</p>
            </div>
          ) : (
            <div className="space-y-4">
              {errors.map((error) => (
                <div
                  key={error._id}
                  className={`border rounded-lg p-4 ${
                    error.status === 'unresolved' ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950' : 'border-gray-200 dark:border-gray-700 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Printer className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <h3 className="font-semibold text-lg dark:text-gray-100">{error.printerName}</h3>
                        <Badge className={getPriorityColor(error.priority)}>
                          {error.priority}
                        </Badge>
                        <Badge className={getStatusColor(error.status)}>
                          {error.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="space-y-2 ml-8">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                          <span className="font-medium text-red-800 dark:text-red-400">{error.errorType}</span>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300">{error.description}</p>

                        {error.metadata?.location && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            📍 Location: {error.metadata.location}
                          </p>
                        )}

                        {error.metadata?.ipAddress && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            🌐 IP: {error.metadata.ipAddress}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>🕐 {formatTimestamp(error.timestamp)}</span>
                          <span>({getTimeAgo(error.timestamp)})</span>
                        </div>

                        {error.resolvedAt && (
                          <div className="text-sm text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-950 p-2 rounded">
                            ✅ Resolved by {error.resolvedBy} on {formatTimestamp(error.resolvedAt)}
                            {error.resolutionNotes && <p className="mt-1">{error.resolutionNotes}</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {error.status === 'unresolved' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateErrorStatus(error._id, 'in_progress')}
                          >
                            Start Working
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => updateErrorStatus(error._id, 'resolved')}
                          >
                            Mark Resolved
                          </Button>
                        </>
                      )}

                      {error.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateErrorStatus(error._id, 'resolved')}
                        >
                          Mark Resolved
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteError(error._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
