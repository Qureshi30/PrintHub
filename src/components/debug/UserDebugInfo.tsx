import { useUser } from '@clerk/clerk-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function UserDebugInfo() {
  const { user, isLoaded, isSignedIn } = useUser();

  const handleRefreshUser = async () => {
    if (user) {
      await user.reload();
      window.location.reload();
    }
  };

  const handleClearSession = () => {
    // Clear all local storage and session storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Force refresh
    window.location.href = '/';
  };

  if (!isLoaded) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading user data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSignedIn) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-red-600">Not Signed In</CardTitle>
          <CardDescription>You are not currently signed in.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 User Debug Information
            <Button onClick={handleRefreshUser} variant="outline" size="sm">
              Refresh User Data
            </Button>
            <Button onClick={handleClearSession} variant="outline" size="sm">
              Clear Session & Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Debug information for troubleshooting authentication issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Basic Info</h4>
              <div className="space-y-1 text-sm">
                <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
                <p><strong>Email:</strong> {user?.emailAddresses?.[0]?.emailAddress || 'Not available'}</p>
                <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                <p><strong>Is Loaded:</strong> <Badge variant={isLoaded ? "default" : "destructive"}>{isLoaded ? "Yes" : "No"}</Badge></p>
                <p><strong>Is Signed In:</strong> <Badge variant={isSignedIn ? "default" : "destructive"}>{isSignedIn ? "Yes" : "No"}</Badge></p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Role Information</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Current Role:</strong> 
                  <Badge 
                    variant={user?.publicMetadata?.role === 'admin' ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {user?.publicMetadata?.role as string || 'No role set'}
                  </Badge>
                </p>
                <p><strong>Has Public Metadata:</strong> 
                  <Badge variant={user?.publicMetadata ? "default" : "destructive"}>
                    {user?.publicMetadata ? "Yes" : "No"}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Public Metadata (Raw)</h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(user?.publicMetadata || {}, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Full User Object (Raw)</h4>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify({
                id: user?.id,
                firstName: user?.firstName,
                lastName: user?.lastName,
                emailAddresses: user?.emailAddresses,
                publicMetadata: user?.publicMetadata,
                createdAt: user?.createdAt,
                updatedAt: user?.updatedAt
              }, null, 2)}
            </pre>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Troubleshooting Steps</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Check if role is "admin" in the Public Metadata section above</li>
              <li>If role is not "admin", the backend script may need to be run again</li>
              <li>Try clicking "Refresh User Data" to reload user information</li>
              <li>If still not working, try "Clear Session & Refresh" to clear cache</li>
              <li>As a last resort, sign out completely and sign back in</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}