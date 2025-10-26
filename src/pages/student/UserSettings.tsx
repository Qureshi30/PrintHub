import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Shield,
  Calendar,
  Bell,
  Settings as SettingsIcon,
  CheckCircle2,
  Save,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function UserSettings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [printReminders, setPrintReminders] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // Editable profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Fetch user profile from MongoDB
  const fetchUserProfile = async () => {
    if (!user?.id) return;

    setIsFetching(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.profile) {
          // Update form fields with MongoDB data
          setFirstName(data.data.profile.firstName || user.firstName || "");
          setLastName(data.data.profile.lastName || user.lastName || "");
          setPhone(data.data.profile.phone || "");
        } else {
          // Fallback to Clerk data if MongoDB doesn't have profile
          setFirstName(user.firstName || "");
          setLastName(user.lastName || "");
          setPhone(user.publicMetadata?.phone as string || "");
        }
      } else {
        // If profile doesn't exist in MongoDB, use Clerk data
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setPhone(user.publicMetadata?.phone as string || "");
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Fallback to Clerk data
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.publicMetadata?.phone as string || "");
    } finally {
      setIsFetching(false);
    }
  };

  // Initialize form fields when user data loads or changes
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user?.id]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update profile');
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });

      // Reload user data from Clerk and refetch profile from MongoDB
      await user?.reload();
      await fetchUserProfile();

    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = () => {
    // TODO: Implement preference saving to backend
    toast({
      title: "Preferences saved",
      description: "Your notification preferences have been updated.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-black dark:via-black dark:to-black p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              User Settings
            </h1>
            <p className="text-muted-foreground dark:text-gray-300">Manage your profile and preferences</p>
          </div>
        </div>

        {/* Profile Information */}
        <Card className="border-blue-100 dark:border-gray-800 dark:bg-black">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <UserIcon className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription className="dark:text-gray-300">Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6 dark:bg-black">
            {/* Avatar and Basic Info */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-2 border-blue-200 dark:border-gray-700">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback className="bg-blue-100 dark:bg-gray-900 text-blue-600 dark:text-blue-400 text-xl">
                  {firstName?.[0]}{lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold dark:text-white">
                    {firstName} {lastName}
                  </h2>
                  {user?.publicMetadata?.verified && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-blue-50 dark:bg-gray-900 dark:text-blue-400 dark:border-gray-700">
                    {(user?.publicMetadata?.college as string) || "Student"}
                  </Badge>
                  {user?.publicMetadata?.department && (
                    <Badge variant="outline" className="bg-purple-50 dark:bg-gray-900 dark:text-purple-400 dark:border-gray-700">
                      {user?.publicMetadata?.department as string}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator className="dark:border-gray-800" />

            {/* Editable Fields */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-white">
                <UserIcon className="h-4 w-4" />
                Personal Details
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="dark:text-gray-200">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    maxLength={50}
                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="dark:text-gray-200">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    maxLength={50}
                    className="dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="phone" className="dark:text-gray-200">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      maxLength={20}
                      className="dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="dark:border-gray-800" />

            {/* Read-Only Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-white">
                <Mail className="h-4 w-4" />
                Account Information (Read-Only)
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-muted-foreground dark:text-gray-300">Email</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 dark:bg-gray-900 rounded-md">
                    <Mail className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                    <span className="text-sm dark:text-white">{user?.emailAddresses[0]?.emailAddress}</span>
                  </div>
                </div>
                {user?.publicMetadata?.studentId && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground dark:text-gray-300">Student ID</Label>
                    <div className="flex items-center gap-2 p-2 bg-muted/50 dark:bg-gray-900 rounded-md">
                      <Shield className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                      <span className="text-sm font-mono dark:text-white">{user?.publicMetadata?.studentId as string}</span>
                    </div>
                  </div>
                )}
                {user?.publicMetadata?.department && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground dark:text-gray-300">Department</Label>
                    <div className="flex items-center gap-2 p-2 bg-muted/50 dark:bg-gray-900 rounded-md">
                      <Building2 className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                      <span className="text-sm dark:text-white">{user?.publicMetadata?.department as string}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-muted-foreground dark:text-gray-300">Member Since</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 dark:bg-gray-900 rounded-md">
                    <Calendar className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                    <span className="text-sm dark:text-white">{user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Profile Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveProfile}
                disabled={isLoading || !firstName.trim() || !lastName.trim()}
                className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-purple-100 dark:border-gray-800 dark:bg-black">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription className="dark:text-gray-300">Manage how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6 dark:bg-black">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="dark:text-white">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    Receive email updates about your print jobs
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator className="dark:border-gray-800" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="print-reminders" className="dark:text-white">Print Reminders</Label>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    Get reminded when your prints are ready
                  </p>
                </div>
                <Switch
                  id="print-reminders"
                  checked={printReminders}
                  onCheckedChange={setPrintReminders}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSavePreferences}
                className="dark:bg-purple-600 dark:hover:bg-purple-700 dark:text-white"
              >
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
