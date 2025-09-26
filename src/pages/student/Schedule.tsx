import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ArrowLeft, 
  Check,
  AlertCircle,
  FileText,
  MapPin
} from "lucide-react";

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  printer: string;
}

export default function Schedule() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  
  // Mock time slots for the selected date
  const timeSlots: TimeSlot[] = [
    { id: "1", time: "9:00 AM", available: true, printer: "Library-A4-01" },
    { id: "2", time: "9:30 AM", available: true, printer: "Library-A4-01" },
    { id: "3", time: "10:00 AM", available: false, printer: "Library-A4-01" },
    { id: "4", time: "10:30 AM", available: true, printer: "Library-A4-01" },
    { id: "5", time: "11:00 AM", available: true, printer: "Library-A4-02" },
    { id: "6", time: "11:30 AM", available: true, printer: "Library-A4-02" },
    { id: "7", time: "12:00 PM", available: false, printer: "Library-A4-02" },
    { id: "8", time: "12:30 PM", available: true, printer: "Library-A4-02" },
    { id: "9", time: "1:00 PM", available: true, printer: "Library-A4-03" },
    { id: "10", time: "1:30 PM", available: true, printer: "Library-A4-03" },
    { id: "11", time: "2:00 PM", available: true, printer: "Library-A4-03" },
    { id: "12", time: "2:30 PM", available: false, printer: "Library-A4-03" },
  ];

  const handleSchedule = () => {
    if (!selectedDate || !selectedTimeSlot) {
      toast({
        title: "Missing information",
        description: "Please select both a date and time slot.",
        variant: "destructive"
      });
      return;
    }

    const selectedSlot = timeSlots.find(slot => slot.id === selectedTimeSlot);
    const formattedDate = selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    toast({
      title: "Print job scheduled!",
      description: `Your job is scheduled for ${formattedDate} at ${selectedSlot?.time}`,
    });

    // Navigate to confirmation or back to settings
    navigate('/confirmation');
  };

  const handleBackToSettings = () => {
    navigate('/print-settings');
  };

  // Filter available dates (disable past dates and weekends for this example)
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Disable past dates and weekends
    return checkDate < today || date.getDay() === 0 || date.getDay() === 6;
  };

  const availableSlots = timeSlots.filter(slot => slot.available);
  const unavailableSlots = timeSlots.filter(slot => !slot.available);

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Schedule Print Job</h1>
              <p className="text-muted-foreground">
                Choose when you'd like your documents to be printed
              </p>
            </div>
          </div>

          {/* Back Button */}
          <Button variant="outline" onClick={handleBackToSettings}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Print Settings
          </Button>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Calendar Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={isDateDisabled}
                  className="w-full"
                />
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Operating Hours</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Monday - Friday: 8:00 AM - 6:00 PM<br />
                    Weekend printing not available
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Time Slot Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Select Time Slot
                </CardTitle>
                {selectedDate && (
                  <p className="text-sm text-muted-foreground">
                    {selectedDate.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {selectedDate ? (
                  <div className="space-y-4">
                    {/* Available Slots */}
                    <div>
                      <Label className="text-green-600 font-medium">
                        Available Times ({availableSlots.length})
                      </Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedTimeSlot(slot.id)}
                            className={`p-3 text-left border rounded-lg transition-colors ${
                              selectedTimeSlot === slot.id
                                ? 'border-green-500 bg-green-50 text-green-800'
                                : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                            }`}
                          >
                            <div className="font-medium">{slot.time}</div>
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {slot.printer}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Unavailable Slots */}
                    {unavailableSlots.length > 0 && (
                      <div>
                        <Label className="text-gray-500 font-medium">
                          Unavailable Times ({unavailableSlots.length})
                        </Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {unavailableSlots.map((slot) => (
                            <div
                              key={slot.id}
                              className="p-3 border border-gray-200 rounded-lg bg-gray-50 opacity-50"
                            >
                              <div className="font-medium text-gray-500">{slot.time}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {slot.printer}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a date to view available time slots</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Selected Schedule Summary */}
          {selectedDate && selectedTimeSlot && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Schedule Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-green-800">Date</Label>
                      <p className="font-medium text-green-900">
                        {selectedDate.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-green-800">Time</Label>
                      <p className="font-medium text-green-900">
                        {timeSlots.find(slot => slot.id === selectedTimeSlot)?.time}
                      </p>
                    </div>
                    <div>
                      <Label className="text-green-800">Printer Location</Label>
                      <p className="font-medium text-green-900">
                        {timeSlots.find(slot => slot.id === selectedTimeSlot)?.printer}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                    <FileText className="h-4 w-4 text-green-700" />
                    <span className="text-sm text-green-700">
                      3 documents • 15 total pages • ₹30.00 estimated cost
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button 
                    onClick={handleSchedule}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirm Schedule
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedTimeSlot("")}>
                    Change Time
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Important Notes</span>
                  </div>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Please arrive 5 minutes before your scheduled time</li>
                    <li>• Bring student ID for verification</li>
                    <li>• Jobs not collected within 24 hours will be discarded</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
