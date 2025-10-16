import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";
import { AdminMobileSidebar } from "@/components/admin/AdminMobileSidebar";
import { Mail, ExternalLink, CheckCircle, AlertCircle, Copy, Send } from "lucide-react";
import emailService from "@/lib/emailService";

export default function EmailConfiguration() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const configStatus = emailService.getConfigurationStatus();

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address to test.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const success = await emailService.testEmailService(testEmail);
      if (success) {
        toast({
          title: "Test email sent!",
          description: `Check ${testEmail} for the test notification.`,
        });
      } else {
        toast({
          title: "Test failed",
          description: "Failed to send test email. Check your configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Email test error:', error);
      toast({
        title: "Error",
        description: "An error occurred while sending the test email.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard.",
    });
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <AdminMobileSidebar open={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
        
        <AdminMobileHeader 
          title="Email Configuration"
          subtitle="Set up email notifications for print job completions"
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        
        <div className="p-4 pb-20 space-y-4">
          {/* Configuration Status */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-xl">
                {configStatus.configured ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                )}
                Configuration Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border">
                  <span className="font-medium text-gray-800 dark:text-gray-200">EmailJS Service</span>
                  <Badge 
                    variant={configStatus.configured ? "default" : "secondary"}
                    className={`px-3 py-1 font-semibold ${
                      configStatus.configured 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                    }`}
                  >
                    {configStatus.configured ? "Configured" : "Not Configured"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Service ID</span>
                  <Badge 
                    variant={configStatus.serviceId ? "default" : "secondary"}
                    className={`px-3 py-1 font-semibold ${
                      configStatus.serviceId 
                        ? "bg-blue-100 text-blue-800 border-blue-200" 
                        : "bg-red-100 text-red-600 border-red-200"
                    }`}
                  >
                    {configStatus.serviceId ? "Set" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Template ID</span>
                  <Badge 
                    variant={configStatus.templateId ? "default" : "secondary"}
                    className={`px-3 py-1 font-semibold ${
                      configStatus.templateId 
                        ? "bg-blue-100 text-blue-800 border-blue-200" 
                        : "bg-red-100 text-red-600 border-red-200"
                    }`}
                  >
                    {configStatus.templateId ? "Set" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border">
                  <span className="font-medium text-gray-800 dark:text-gray-200">Public Key</span>
                  <Badge 
                    variant={configStatus.publicKey ? "default" : "secondary"}
                    className={`px-3 py-1 font-semibold ${
                      configStatus.publicKey 
                        ? "bg-blue-100 text-blue-800 border-blue-200" 
                        : "bg-red-100 text-red-600 border-red-200"
                    }`}
                  >
                    {configStatus.publicKey ? "Set" : "Missing"}
                  </Badge>
                </div>
              </div>

              {!configStatus.configured && (
                <Alert className="border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Email notifications are not configured. Follow the setup instructions below.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Test Email */}
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-green-50 dark:bg-green-900/20">
              <CardTitle className="flex items-center gap-2 text-xl text-green-800 dark:text-green-200">
                <Send className="h-6 w-6" />
                Test Email Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-4">
                <Label htmlFor="test-email" className="text-base font-medium">
                  Test Email Address
                </Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="Enter email to test notifications"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="text-base h-12"
                />
              </div>
              
              <Button 
                onClick={handleTestEmail} 
                disabled={isTesting || !configStatus.configured}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                {isTesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Test Email...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>
              
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                This will send a sample print job completion notification to test your email configuration.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Configuration Status */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
            <CardTitle className="flex items-center gap-2 text-xl">
              {configStatus.configured ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              )}
              Configuration Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border">
                <span className="font-medium text-gray-800 dark:text-gray-200">EmailJS Service</span>
                <Badge 
                  variant={configStatus.configured ? "default" : "secondary"}
                  className={`px-3 py-1 font-semibold ${
                    configStatus.configured 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {configStatus.configured ? "Configured" : "Not Configured"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border">
                <span className="font-medium text-gray-800 dark:text-gray-200">Service ID</span>
                <Badge 
                  variant={configStatus.serviceId ? "default" : "secondary"}
                  className={`px-3 py-1 font-semibold ${
                    configStatus.serviceId 
                      ? "bg-blue-100 text-blue-800 border-blue-200" 
                      : "bg-red-100 text-red-600 border-red-200"
                  }`}
                >
                  {configStatus.serviceId ? "Set" : "Missing"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border">
                <span className="font-medium text-gray-800 dark:text-gray-200">Template ID</span>
                <Badge 
                  variant={configStatus.templateId ? "default" : "secondary"}
                  className={`px-3 py-1 font-semibold ${
                    configStatus.templateId 
                      ? "bg-blue-100 text-blue-800 border-blue-200" 
                      : "bg-red-100 text-red-600 border-red-200"
                  }`}
                >
                  {configStatus.templateId ? "Set" : "Missing"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border">
                <span className="font-medium text-gray-800 dark:text-gray-200">Public Key</span>
                <Badge 
                  variant={configStatus.publicKey ? "default" : "secondary"}
                  className={`px-3 py-1 font-semibold ${
                    configStatus.publicKey 
                      ? "bg-blue-100 text-blue-800 border-blue-200" 
                      : "bg-red-100 text-red-600 border-red-200"
                  }`}
                >
                  {configStatus.publicKey ? "Set" : "Missing"}
                </Badge>
              </div>
            </div>

            {!configStatus.configured && (
              <Alert className="border-2 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Email notifications are not configured. Follow the setup instructions below.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle className="text-xl text-blue-800 dark:text-blue-200">Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">1. Create EmailJS Account</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Sign up for a free EmailJS account to send emails from your frontend application.
              </p>
              <Button
                variant="outline"
                onClick={() => window.open("https://www.emailjs.com/", "_blank")}
                className="w-fit border-2 hover:bg-blue-50"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Go to EmailJS
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">2. Configure Email Service</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Add an email service (Gmail, Outlook, etc.) and create an email template.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">3. Set Environment Variables</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Add these variables to your <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono text-sm">.env</code> file:
              </p>
              <div className="bg-gray-900 dark:bg-gray-800 p-6 rounded-lg border-2 border-gray-300 dark:border-gray-600 font-mono text-sm space-y-3">
                <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-700 p-3 rounded border">
                  <span className="text-green-400">VITE_EMAILJS_SERVICE_ID=your_service_id</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("VITE_EMAILJS_SERVICE_ID=your_service_id")}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-700 p-3 rounded border">
                  <span className="text-green-400">VITE_EMAILJS_TEMPLATE_ID=your_template_id</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("VITE_EMAILJS_TEMPLATE_ID=your_template_id")}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-700 p-3 rounded border">
                  <span className="text-green-400">VITE_EMAILJS_PUBLIC_KEY=your_public_key</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("VITE_EMAILJS_PUBLIC_KEY=your_public_key")}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">4. Email Template Variables</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Your EmailJS template should include these variables:
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-700 font-mono text-sm">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    '{{to_email}}',
                    '{{to_name}}',
                    '{{subject}}',
                    '{{html_content}}',
                    '{{job_id}}',
                    '{{file_name}}',
                    '{{printer_location}}',
                    '{{completion_time}}'
                  ].map((variable, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-300 dark:border-blue-600">
                      <span className="text-blue-700 dark:text-blue-300 font-semibold">{variable}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Email */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="bg-green-50 dark:bg-green-900/20">
            <CardTitle className="text-xl text-green-800 dark:text-green-200">Test Email Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="testEmail" className="text-gray-800 dark:text-gray-200 font-medium">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="Enter email to test"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="border-2 mt-2"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleTestEmail}
                  disabled={isTesting || !testEmail}
                  className="bg-green-600 hover:bg-green-700 text-white border-2 border-green-600"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isTesting ? "Sending..." : "Send Test"}
                </Button>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              This will send a sample print job completion notification to test your email configuration.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
