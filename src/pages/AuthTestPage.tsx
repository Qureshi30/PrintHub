import { useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, UserCheck, Shield } from 'lucide-react';

interface TestResult {
  endpoint: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export default function AuthTestPage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runAuthTest = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setTestResults([]);
    
    const tests = [
      {
        name: 'Admin Overview',
        endpoint: '/api/admin/overview',
        method: 'GET'
      },
      {
        name: 'Admin Dashboard Stats',
        endpoint: '/api/admin/dashboard-stats',
        method: 'GET'
      },
      {
        name: 'Admin Auth Test',
        endpoint: '/api/admin/test-auth',
        method: 'POST'
      }
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
      try {
        const token = await getToken();
        const response = await fetch(`http://localhost:3001${test.endpoint}`, {
          method: test.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        results.push({
          endpoint: test.name,
          success: response.ok,
          message: data.message || (response.ok ? 'Success' : 'Failed'),
          data: response.ok ? data : undefined,
          error: response.ok ? undefined : data.error?.message || 'Unknown error'
        });
      } catch (error) {
        results.push({
          endpoint: test.name,
          success: false,
          message: 'Network Error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setTestResults(results);
    setIsLoading(false);
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-6">
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to test authentication
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const userRole = user.publicMetadata?.role as string || 'No role assigned';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Authentication Test
          </CardTitle>
          <CardDescription>
            Test role-based authentication with Clerk and backend middleware
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info */}
          <div className="space-y-2">
            <h3 className="font-semibold">Current User</h3>
            <div className="flex items-center gap-2">
              <span>{user.fullName || 'No name'}</span>
              <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                {userRole}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{user.emailAddresses[0]?.emailAddress}</p>
          </div>

          {/* Test Button */}
          <Button 
            onClick={runAuthTest} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Testing...' : 'Test Admin Endpoints'}
          </Button>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results</h3>
              {testResults.map((result, index) => (
                <Card key={`test-${result.endpoint}-${index}`} className="border-l-4 border-l-transparent data-[success=true]:border-l-green-500 data-[success=false]:border-l-red-500" data-success={result.success}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {result.endpoint}
                      <Badge variant={result.success ? 'default' : 'destructive'} className="ml-auto">
                        {result.success ? 'PASS' : 'FAIL'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm">{result.message}</p>
                    {result.error && (
                      <p className="text-sm text-red-600 mt-1">Error: {result.error}</p>
                    )}
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-sm font-medium cursor-pointer">Response Data</summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Role Info */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {userRole === 'admin' 
                ? 'You have admin role - all endpoints should work'
                : `You have "${userRole}" role - admin endpoints should be blocked`
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
