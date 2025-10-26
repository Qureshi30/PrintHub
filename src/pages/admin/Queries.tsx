import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth } from "@clerk/clerk-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    MessageSquare,
    Search,
    Filter,
    Mail,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Trash2,
    Eye,
    RefreshCw,
    User,
    Calendar,
    Tag,
    TrendingUp
} from "lucide-react";

interface Query {
    _id: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    category: string;
    subject: string;
    message: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    adminResponse?: string;
    respondedBy?: string;
    respondedAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface QueryStats {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    urgent: number;
}

export default function Queries() {
    const { user } = useUser();
    const { getToken } = useAuth();
    const { toast } = useToast();

    const [queries, setQueries] = useState<Query[]>([]);
    const [filteredQueries, setFilteredQueries] = useState<Query[]>([]);
    const [stats, setStats] = useState<QueryStats>({
        total: 0,
        open: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        urgent: 0
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [adminResponse, setAdminResponse] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [newPriority, setNewPriority] = useState("");

    useEffect(() => {
        fetchQueries();
        fetchStats();
    }, []);

    useEffect(() => {
        filterQueries();
    }, [queries, searchTerm, statusFilter, priorityFilter]);

    const fetchQueries = async () => {
        try {
            const token = await getToken();
            const response = await fetch('http://localhost:3001/api/queries/admin/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setQueries(data.data);
            }
        } catch (error) {
            console.error('Error fetching queries:', error);
            toast({
                title: "Error",
                description: "Failed to fetch support tickets",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = await getToken();
            const response = await fetch('http://localhost:3001/api/queries/admin/stats/overview', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const filterQueries = () => {
        let filtered = queries;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(q =>
                q.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(q => q.status === statusFilter);
        }

        // Priority filter
        if (priorityFilter !== "all") {
            filtered = filtered.filter(q => q.priority === priorityFilter);
        }

        setFilteredQueries(filtered);
    };

    const handleViewQuery = (query: Query) => {
        setSelectedQuery(query);
        setAdminResponse(query.adminResponse || "");
        setNewStatus(query.status);
        setNewPriority(query.priority);
        setIsDialogOpen(true);
    };

    const handleUpdateQuery = async () => {
        if (!selectedQuery) return;

        try {
            const token = await getToken();
            const response = await fetch(`http://localhost:3001/api/queries/admin/${selectedQuery._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: newStatus,
                    priority: newPriority,
                    adminResponse: adminResponse
                })
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: "✅ Query updated",
                    description: "The support ticket has been updated successfully."
                });

                setIsDialogOpen(false);
                fetchQueries();
                fetchStats();
            }
        } catch (error) {
            console.error('Error updating query:', error);
            toast({
                title: "Error",
                description: "Failed to update query",
                variant: "destructive"
            });
        }
    };

    const handleDeleteQuery = async (id: string) => {
        if (!confirm("Are you sure you want to delete this query?")) return;

        try {
            const token = await getToken();
            const response = await fetch(`http://localhost:3001/api/queries/admin/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                toast({
                    title: "✅ Query deleted",
                    description: "The support ticket has been deleted."
                });

                fetchQueries();
                fetchStats();
            }
        } catch (error) {
            console.error('Error deleting query:', error);
            toast({
                title: "Error",
                description: "Failed to delete query",
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
            'open': { variant: 'destructive', icon: AlertCircle },
            'in-progress': { variant: 'default', icon: Clock },
            'resolved': { variant: 'outline', icon: CheckCircle2 },
            'closed': { variant: 'secondary', icon: XCircle }
        };

        const config = variants[status] || variants.open;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                <Icon className="h-3 w-3" />
                {status.replace('-', ' ').toUpperCase()}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const colors: Record<string, string> = {
            'low': 'bg-gray-100 text-gray-800',
            'medium': 'bg-blue-100 text-blue-800',
            'high': 'bg-orange-100 text-orange-800',
            'urgent': 'bg-red-100 text-red-800'
        };

        return (
            <Badge className={colors[priority] || colors.medium}>
                {priority.toUpperCase()}
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-8 w-8 text-blue-600" />
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Student Queries</h1>
                            <p className="text-muted-foreground">Manage and respond to student support tickets</p>
                        </div>
                    </div>
                    <Button onClick={fetchQueries} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">Total Queries</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                <span className="text-2xl font-bold">{stats.total}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-200 bg-red-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-700">Open</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="text-2xl font-bold text-red-900">{stats.open}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700">In Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-2xl font-bold text-blue-900">{stats.inProgress}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-green-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-700">Resolved</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-2xl font-bold text-green-900">{stats.resolved}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 bg-gray-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-700">Closed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4 text-gray-600" />
                                <span className="text-2xl font-bold text-gray-900">{stats.closed}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-orange-700">Urgent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-orange-600" />
                                <span className="text-2xl font-bold text-orange-900">{stats.urgent}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name, email, subject..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in-progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priority</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Queries Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Queries ({filteredQueries.length})</CardTitle>
                        <CardDescription>View and manage student support tickets</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredQueries.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p className="text-lg font-medium">No queries found</p>
                                <p className="text-sm">Try adjusting your filters or check back later.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Created At</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredQueries.map((query) => (
                                            <TableRow key={query._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                        <div>
                                                            <p className="font-medium dark:text-gray-200">{query.studentName}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{query.studentEmail}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                        <Tag className="h-3 w-3" />
                                                        {query.category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    <p className="truncate font-medium dark:text-gray-200">{query.subject}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{query.message}</p>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(query.status)}</TableCell>
                                                <TableCell>{getPriorityBadge(query.priority)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm dark:text-gray-300">
                                                        <Calendar className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                                        {formatDate(query.createdAt)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleViewQuery(query)}
                                                        >
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleDeleteQuery(query._id)}
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Query Detail Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Query Details</DialogTitle>
                        <DialogDescription>
                            View and respond to student support ticket
                        </DialogDescription>
                    </DialogHeader>

                    {selectedQuery && (
                        <div className="space-y-4">
                            {/* Student Info */}
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Student Name</p>
                                        <p className="font-medium dark:text-gray-200">{selectedQuery.studentName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                                        <p className="font-medium dark:text-gray-200">{selectedQuery.studentEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Created At</p>
                                        <p className="font-medium dark:text-gray-200">{formatDate(selectedQuery.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Category</p>
                                        <Badge variant="outline">{selectedQuery.category}</Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subject</p>
                                <p className="font-medium text-lg dark:text-gray-200">{selectedQuery.subject}</p>
                            </div>

                            {/* Message */}
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Message</p>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                    <p className="whitespace-pre-wrap dark:text-gray-200">{selectedQuery.message}</p>
                                </div>
                            </div>

                            {/* Status & Priority */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status</p>
                                    <Select value={newStatus} onValueChange={setNewStatus}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="resolved">Resolved</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Priority</p>
                                    <Select value={newPriority} onValueChange={setNewPriority}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Admin Response */}
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Admin Response</p>
                                <Textarea
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    placeholder="Write your response to the student..."
                                    rows={5}
                                />
                            </div>

                            {selectedQuery.respondedAt && (
                                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                                    <p className="text-blue-900">
                                        <strong>Last Responded:</strong> {formatDate(selectedQuery.respondedAt)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateQuery} className="bg-gradient-hero">
                            <Mail className="h-4 w-4 mr-2" />
                            Update & Send Response
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
