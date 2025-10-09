import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle,
  X,
  FileText,
  User,
  MapPin,
  Clock,
  DollarSign
} from "lucide-react";
import type { PrintJobCompletionData } from "@/hooks/useAdminCompletionNotifications";

interface AdminCompletionNotificationProps {
  jobData: PrintJobCompletionData;
  onClose: () => void;
  onViewDetails?: () => void;
  autoCloseAfter?: number; // Auto-close after X seconds
}

export default function AdminCompletionNotification({
  jobData,
  onClose,
  onViewDetails,
  autoCloseAfter = 10 // Default 10 seconds
}: AdminCompletionNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(autoCloseAfter);

  useEffect(() => {
    if (autoCloseAfter > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [autoCloseAfter, onClose]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-right duration-300">
      <Card className="shadow-lg border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-green-100 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-green-800 text-lg">
                Print Job Completed
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              {autoCloseAfter > 0 && (
                <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  {timeLeft}s
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 hover:bg-green-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Job Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">
                {jobData.file.originalName}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-green-700">
              <User className="h-3 w-3" />
              <span>{jobData.userName}</span>
              <span className="text-green-500">•</span>
              <span>{jobData.userEmail}</span>
            </div>
          </div>

          {/* Printer & Location */}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-green-800 font-medium">{jobData.printer.name}</span>
            <span className="text-green-600">at {jobData.printer.location}</span>
          </div>

          {/* Print Settings */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs border-green-300 text-green-700">
              {jobData.settings.copies} {jobData.settings.copies > 1 ? 'copies' : 'copy'}
            </Badge>
            <Badge variant="outline" className="text-xs border-green-300 text-green-700">
              {jobData.settings.color ? 'Color' : 'B&W'}
            </Badge>
            <Badge variant="outline" className="text-xs border-green-300 text-green-700">
              {jobData.settings.duplex ? 'Duplex' : 'Single-sided'}
            </Badge>
            <Badge variant="outline" className="text-xs border-green-300 text-green-700">
              {jobData.settings.paperType}
            </Badge>
          </div>

          {/* Cost & Timing */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-green-700">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">{formatCurrency(jobData.cost.totalCost)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-green-600">
              <Clock className="h-4 w-4" />
              <span>{formatTime(jobData.processingTime)}</span>
            </div>
          </div>

          {/* Completion Time */}
          <div className="text-xs text-green-600 border-t border-green-200 pt-2">
            Completed at {new Date(jobData.completedAt).toLocaleString()}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onViewDetails && (
              <Button
                size="sm"
                variant="outline"
                onClick={onViewDetails}
                className="flex-1 border-green-300 text-green-700 hover:bg-green-100"
              >
                View Details
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={onClose}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}