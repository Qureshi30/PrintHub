import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Settings, 
  Bell, 
  Moon, 
  Shield, 
  ExternalLink,
  Save,
  School
} from "lucide-react";

export default function UserSettings() {
  const { user } = useUser();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    printReminders: true,
    darkMode: false,
    autoSelectFiles: true,
    defaultCopies: 1,
    defaultPaperSize: "A4"
  });

  const handleSettingChange = (key: string, value: boolean | number | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = () => {
    // In real app, save to backend
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const openClerkProfile = () => {
    // Open Clerk's user profile management
    window.open("/user", "_blank");
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Settings</h1>
              <p className="text-muted-foreground">
                Manage your account preferences and personal information
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Information */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-3">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      {user?.imageUrl ? (
                        <img 
                          src={user.imageUrl} 
                          alt="Profile" 
                          className="w-20 h-20 rounded-full"
                        />
                      ) : (
                        <User className="h-10 w-10 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {user?.firstName} {user?.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">College/University</span>
                      <Badge variant="secondary">
                        <School className="h-3 w-3 mr-1" />
                        {(user?.publicMetadata?.college as string) || "Tech University"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Verification</span>
                      <Badge variant={user?.emailAddresses?.[0]?.verification?.status === "verified" ? "default" : "secondary"}>
                        <Shield className="h-3 w-3 mr-1" />
                        {user?.emailAddresses?.[0]?.verification?.status === "verified" ? "Verified" : "Pending"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Member Since</span>
                      <span className="text-sm text-muted-foreground">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}
                      </span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={openClerkProfile}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Profile
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive updates about your print jobs via email
                      </div>
                    </div>
                    <Switch 
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Print Reminders</Label>
                      <div className="text-sm text-muted-foreground">
                        Get reminded when your prints are ready for collection
                      </div>
                    </div>
                    <Switch 
                      checked={settings.printReminders}
                      onCheckedChange={(checked) => handleSettingChange('printReminders', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Appearance Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Moon className="h-5 w-5" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <div className="text-sm text-muted-foreground">
                        Switch to dark theme for better night viewing
                      </div>
                    </div>
                    <Switch 
                      checked={settings.darkMode}
                      onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Print Defaults */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Print Defaults
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-select uploaded files</Label>
                      <div className="text-sm text-muted-foreground">
                        Automatically select new uploads for printing
                      </div>
                    </div>
                    <Switch 
                      checked={settings.autoSelectFiles}
                      onCheckedChange={(checked) => handleSettingChange('autoSelectFiles', checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultCopies">Default Copies</Label>
                      <Input
                        id="defaultCopies"
                        type="number"
                        min="1"
                        max="10"
                        value={settings.defaultCopies}
                        onChange={(e) => handleSettingChange('defaultCopies', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="defaultPaperSize">Default Paper Size</Label>
                      <select 
                        id="defaultPaperSize"
                        value={settings.defaultPaperSize}
                        onChange={(e) => handleSettingChange('defaultPaperSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="A4">A4</option>
                        <option value="A3">A3</option>
                        <option value="Letter">Letter</option>
                        <option value="Legal">Legal</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button onClick={handleSaveSettings} className="w-full bg-gradient-hero">
                <Save className="h-4 w-4 mr-2" />
                Save All Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
