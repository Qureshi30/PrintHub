import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ShieldX, Home, ArrowLeft } from "lucide-react";

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-red-600" />
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Access Denied
              </h1>
              <p className="text-gray-600">
                You do not have permission to view this page.
              </p>
            </div>

            {/* Additional Info */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
              <p>
                This could be because:
              </p>
              <ul className="mt-2 space-y-1 text-left">
                <li>• You need to be logged in to access this resource</li>
                <li>• Your account doesn't have the required permissions</li>
                <li>• The page you're looking for has been moved or deleted</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/')} 
                className="w-full bg-gradient-hero"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>

            {/* Support Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Need help?{" "}
                <button 
                  onClick={() => navigate('/support')}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Contact Support
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
