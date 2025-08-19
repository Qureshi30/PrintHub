import { Bell, Smartphone, Mail, MessageSquare, Settings, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export default function NotificationFeatures() {
  const notificationTypes = [
    {
      icon: CheckCircle,
      title: "Status Updates",
      description: "Get notified when your print job moves through different stages - from processing to ready for pickup.",
      color: "green"
    },
    {
      icon: Clock,
      title: "Pickup Reminders",
      description: "Receive reminders 30 minutes before your scheduled pickup time and if documents are waiting.",
      color: "blue"
    },
    {
      icon: AlertTriangle,
      title: "Issue Alerts",
      description: "Immediate notifications for any problems with your print job, paper jams, or printer maintenance.",
      color: "red"
    },
    {
      icon: Bell,
      title: "Custom Alerts",
      description: "Set up personalized notifications for specific events, locations, or time periods.",
      color: "purple"
    }
  ];

  const notificationChannels = [
    {
      icon: Smartphone,
      title: "Push Notifications",
      description: "Instant mobile and desktop notifications for real-time updates."
    },
    {
      icon: Mail,
      title: "Email Alerts",
      description: "Comprehensive email notifications with detailed print job information."
    },
    {
      icon: MessageSquare,
      title: "SMS Messages",
      description: "Quick text message alerts for urgent status changes and reminders."
    }
  ];

  const sampleNotifications = [
    {
      id: 1,
      type: "success",
      title: "Print Job Completed",
      message: "Your document 'Final Thesis Chapter 1.pdf' is ready for pickup at Main Library.",
      time: "2 minutes ago",
      read: false
    },
    {
      id: 2,
      type: "reminder",
      title: "Pickup Reminder",
      message: "Don't forget to collect your documents from Student Union by 5:00 PM today.",
      time: "30 minutes ago",
      read: false
    },
    {
      id: 3,
      type: "warning",
      title: "Print Job Delayed",
      message: "Your print job has been delayed due to printer maintenance. New ETA: 3:30 PM.",
      time: "1 hour ago",
      read: true
    },
    {
      id: 4,
      type: "info",
      title: "Schedule Confirmation",
      message: "Your print job has been scheduled for pickup tomorrow at 10:00 AM.",
      time: "2 hours ago",
      read: true
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "reminder": return <Clock className="w-5 h-5 text-blue-600" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case "info": return <Bell className="w-5 h-5 text-gray-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBg = (type: string, read: boolean) => {
    const opacity = read ? "bg-opacity-50" : "bg-opacity-100";
    switch (type) {
      case "success": return `bg-green-50 ${opacity}`;
      case "reminder": return `bg-blue-50 ${opacity}`;
      case "warning": return `bg-yellow-50 ${opacity}`;
      case "info": return `bg-gray-50 ${opacity}`;
      default: return `bg-gray-50 ${opacity}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 mb-8 shadow-2xl">
              <Bell className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Smart Notifications
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Stay informed every step of the way with intelligent notifications. Get real-time updates, 
              reminders, and alerts across all your devices.
            </p>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Types of Notifications</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stay updated with different types of smart notifications tailored to your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {notificationTypes.map((type, index) => {
              const IconComponent = type.icon;
              return (
                <Card key={type.title} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-indigo-200">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-${type.color}-100 dark:bg-${type.color}-900/20 flex items-center justify-center group-hover:bg-${type.color}-200 transition-colors`}>
                        <IconComponent className={`w-6 h-6 text-${type.color}-600`} />
                      </div>
                      <CardTitle className="text-xl">{type.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{type.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Notification Channels */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Notification Channels</h2>
            <p className="text-lg text-muted-foreground">
              Choose how you want to receive notifications across different platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {notificationChannels.map((channel, index) => {
              const IconComponent = channel.icon;
              return (
                <Card key={channel.title} className="text-center hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-8 h-8 text-indigo-600" />
                    </div>
                    <CardTitle className="text-xl">{channel.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{channel.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sample Notifications */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Notification Center</h2>
            <p className="text-lg text-muted-foreground">
              See how notifications appear in your dashboard.
            </p>
          </div>

          <div className="space-y-4">
            {sampleNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getNotificationBg(notification.type, notification.read)} ${
                  notification.read ? 'border-gray-200' : 'border-l-4 border-l-indigo-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-500">{notification.time}</span>
                    </div>
                    <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notification Settings */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Notification Preferences</h2>
            <p className="text-lg text-muted-foreground">
              Customize your notification settings to get exactly what you need.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Control when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Print Job Status Updates</h3>
                    <p className="text-sm text-muted-foreground">Get notified when your print job status changes</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Pickup Reminders</h3>
                    <p className="text-sm text-muted-foreground">Receive reminders for scheduled pickups</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Issue Alerts</h3>
                    <p className="text-sm text-muted-foreground">Get alerts for problems or delays</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Promotional Updates</h3>
                    <p className="text-sm text-muted-foreground">Receive news about new features and offers</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">SMS Notifications</h3>
                    <p className="text-sm text-muted-foreground">Receive critical alerts via text message</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Why Smart Notifications?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Never Miss a Pickup</h3>
              <p className="text-muted-foreground">
                Timely reminders ensure you never forget to collect your important documents.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Save Time</h3>
              <p className="text-muted-foreground">
                Know exactly when your documents are ready instead of checking manually.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Quick Problem Resolution</h3>
              <p className="text-muted-foreground">
                Get immediate alerts about issues so they can be resolved quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Stay Connected with Smart Notifications
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Never miss an update about your print jobs. Get the right information at the right time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Set Up Notifications
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
              View Settings
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
