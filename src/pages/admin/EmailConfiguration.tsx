import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Mail, ExternalLink, CheckCircle, AlertCircle, Copy, Send } from "lucide-react";
import emailService from "@/lib/emailService";

export default function EmailConfiguration() {
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Configuration</h1>
            <p className="text-muted-foreground">
              Set up email notifications for print job completions
            </p>
          </div>
        </div>

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {configStatus.configured ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Configuration Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span>EmailJS Service</span>
                <Badge variant={configStatus.configured ? "default" : "secondary"}>
                  {configStatus.configured ? "Configured" : "Not Configured"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Service ID</span>
                <Badge variant={configStatus.serviceId ? "default" : "secondary"}>
                  {configStatus.serviceId ? "Set" : "Missing"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Template ID</span>
                <Badge variant={configStatus.templateId ? "default" : "secondary"}>
                  {configStatus.templateId ? "Set" : "Missing"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Public Key</span>
                <Badge variant={configStatus.publicKey ? "default" : "secondary"}>
                  {configStatus.publicKey ? "Set" : "Missing"}
                </Badge>
              </div>
            </div>

            {!configStatus.configured && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Email notifications are not configured. Follow the setup instructions below.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold">1. Create EmailJS Account</h3>
              <p className="text-sm text-muted-foreground">
                Sign up for a free EmailJS account to send emails from your frontend application.
              </p>
              <Button
                variant="outline"
                onClick={() => window.open("https://www.emailjs.com/", "_blank")}
                className="w-fit"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Go to EmailJS
              </Button>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">2. Configure Email Service</h3>
              <p className="text-sm text-muted-foreground">
                Add an email service (Gmail, Outlook, etc.) and create an email template.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">3. Set Environment Variables</h3>
              <p className="text-sm text-muted-foreground">
                Add these variables to your <code>.env</code> file:
              </p>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span>VITE_EMAILJS_SERVICE_ID=your_service_id</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("VITE_EMAILJS_SERVICE_ID=your_service_id")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>VITE_EMAILJS_TEMPLATE_ID=your_template_id</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("VITE_EMAILJS_TEMPLATE_ID=your_template_id")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span>VITE_EMAILJS_PUBLIC_KEY=your_public_key</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("VITE_EMAILJS_PUBLIC_KEY=your_public_key")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">4. Email Template Variables</h3>
              <p className="text-sm text-muted-foreground">
                Your EmailJS template should include these variables:
              </p>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm grid grid-cols-2 gap-2">
                <span>{'{{to_email}}'}</span>
                <span>{'{{to_name}}'}</span>
                <span>{'{{subject}}'}</span>
                <span>{'{{html_content}}'}</span>
                <span>{'{{job_id}}'}</span>
                <span>{'{{file_name}}'}</span>
                <span>{'{{printer_location}}'}</span>
                <span>{'{{completion_time}}'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Email */}
        <Card>
          <CardHeader>
            <CardTitle>Test Email Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="Enter email to test"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleTestEmail}
                  disabled={isTesting || !testEmail}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isTesting ? "Sending..." : "Send Test"}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              This will send a sample print job completion notification to test your email configuration.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
