import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/clerk-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    DollarSign,
    FileText,
    Printer,
    User,
    XCircle,
    RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CashPrintRequest {
    _id: string;
    clerkUserId: string;
    userName: string;
    userEmail: string;
    printerId: {
        _id: string;
        name: string;
        location: string;
        status: string;
    };
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
    cost: {
        totalCost: number;
    };
    payment: {
        amount: number;
        status: string;
        method: string;
    };
    status: string;
    timing: {
        submittedAt: string;
        updatedAt: string;
        completedAt?: string;
    };
    adminNotes?: string;
    approvedBy?: string;
}

export default function CashPayments() {
    const { getToken } = useAuth();
    const { toast } = useToast();

    const [requests, setRequests] = useState<CashPrintRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<CashPrintRequest | null>(null);
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    useEffect(() => {
        fetchCashRequests();
    }, [filterStatus]);

    const fetchCashRequests = async () => {
        try {
            setLoading(true);
            const token = await getToken();

            const statusParam = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/cash-payment/admin/cash-requests${statusParam}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch cash payment requests');
            }

            const data = await response.json();
            setRequests(data.data || []);
        } catch (error) {
            console.error('Error fetching cash requests:', error);
            toast({
                title: "Error",
                description: "Failed to fetch cash payment requests",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request: CashPrintRequest) => {
        setSelectedRequest(request);
        setShowApprovalDialog(true);
    };

    const confirmApproval = async () => {
        if (!selectedRequest) return;

        try {
            setProcessing(selectedRequest._id);
            const token = await getToken();

            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/cash-payment/admin/cash-requests/${selectedRequest._id}/complete`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ adminNotes })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to approve request');
            }

            toast({
                title: "Success",
                description: "Cash payment approved and print job created",
            });

            setShowApprovalDialog(false);
            setAdminNotes("");
            setSelectedRequest(null);
            fetchCashRequests();
        } catch (error) {
            console.error('Error approving request:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to approve request",
                variant: "destructive",
            });
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (request: CashPrintRequest) => {
        setSelectedRequest(request);
        setShowRejectDialog(true);
    };

    const confirmRejection = async () => {
        if (!selectedRequest) return;

        try {
            setProcessing(selectedRequest._id);
            const token = await getToken();

            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/cash-payment/admin/cash-requests/${selectedRequest._id}/reject`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ reason: adminNotes })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to reject request');
            }

            toast({
                title: "Request Rejected",
                description: "Cash payment request has been rejected",
            });

            setShowRejectDialog(false);
            setAdminNotes("");
            setSelectedRequest(null);
            fetchCashRequests();
        } catch (error) {
            console.error('Error rejecting request:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to reject request",
                variant: "destructive",
            });
        } finally {
            setProcessing(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                </Badge>;
            case 'approved':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approved
                </Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    Rejected
                </Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const totalAmount = requests
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + r.payment.amount, 0);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Cash Payments</h1>
                        <p className="text-muted-foreground">
                            Manage pending cash payment requests and approve print jobs
                        </p>
                    </div>
                    <Button onClick={fetchCashRequests} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending Requests</p>
                                    <p className="text-2xl font-bold">{pendingCount}</p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending Amount</p>
                                    <p className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Requests</p>
                                    <p className="text-2xl font-bold">{requests.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Tabs */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Payment Requests</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus('all')}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={filterStatus === 'pending' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus('pending')}
                                >
                                    Pending
                                </Button>
                                <Button
                                    variant={filterStatus === 'approved' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus('approved')}
                                >
                                    Approved
                                </Button>
                                <Button
                                    variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterStatus('rejected')}
                                >
                                    Rejected
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-2 text-muted-foreground">Loading requests...</p>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-8">
                                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">No cash payment requests found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>File</TableHead>
                                            <TableHead>Printer</TableHead>
                                            <TableHead>Settings</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Submitted</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.map((request) => (
                                            <TableRow key={request._id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <User className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{request.userName}</p>
                                                            <p className="text-xs text-muted-foreground">{request.userEmail}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium text-sm">{request.file.originalName}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {request.file.format.toUpperCase()} • {request.file.sizeKB} KB
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Printer className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm">{request.printerId.name}</p>
                                                            <p className="text-xs text-muted-foreground">{request.printerId.location}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm space-y-1">
                                                        <p>Pages: {request.settings.pages}</p>
                                                        <p>Copies: {request.settings.copies}</p>
                                                        <div className="flex gap-1">
                                                            {request.settings.color && <Badge variant="secondary" className="text-xs">Color</Badge>}
                                                            {request.settings.duplex && <Badge variant="secondary" className="text-xs">Duplex</Badge>}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="font-semibold text-green-600">₹{request.payment.amount.toFixed(2)}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="text-sm">
                                                        {formatDistanceToNow(new Date(request.timing.submittedAt), { addSuffix: true })}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(request.status)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {request.status === 'pending' && (
                                                        <div className="flex gap-2 justify-end">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-green-600 border-green-200 hover:bg-green-50"
                                                                onClick={() => handleApprove(request)}
                                                                disabled={processing === request._id}
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                                onClick={() => handleReject(request)}
                                                                disabled={processing === request._id}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {request.status !== 'pending' && request.adminNotes && (
                                                        <p className="text-xs text-muted-foreground italic">{request.adminNotes}</p>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Approval Dialog */}
                <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Approve Cash Payment</DialogTitle>
                            <DialogDescription>
                                Confirm that you have received the cash payment. This will create a print job and add it to the queue.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {selectedRequest && (
                                <div className="p-4 bg-muted rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">User:</span>
                                        <span className="text-sm">{selectedRequest.userName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">File:</span>
                                        <span className="text-sm">{selectedRequest.file.originalName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Amount:</span>
                                        <span className="text-sm font-bold text-green-600">₹{selectedRequest.payment.amount.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Admin Notes (Optional)</label>
                                <Textarea
                                    placeholder="Add any notes about this payment..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={confirmApproval} disabled={!!processing}>
                                {processing ? 'Processing...' : 'Confirm Payment'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Rejection Dialog */}
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Cash Payment Request</DialogTitle>
                            <DialogDescription>
                                Provide a reason for rejecting this payment request. The user will be notified.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {selectedRequest && (
                                <div className="p-4 bg-muted rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">User:</span>
                                        <span className="text-sm">{selectedRequest.userName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">File:</span>
                                        <span className="text-sm">{selectedRequest.file.originalName}</span>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Rejection Reason *</label>
                                <Textarea
                                    placeholder="Please provide a reason for rejection..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    rows={3}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={confirmRejection}
                                disabled={!!processing || !adminNotes.trim()}
                            >
                                {processing ? 'Processing...' : 'Reject Request'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
