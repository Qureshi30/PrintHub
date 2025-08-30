import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student';
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallbackPath = '/access-denied' 
}: Readonly<ProtectedRouteProps>) {
  const { user, isLoaded } = useUser();

  return (
    <>
      <SignedIn>
        <RoleChecker 
          user={user} 
          isLoaded={isLoaded} 
          requiredRole={requiredRole} 
          fallbackPath={fallbackPath}
        >
          {children}
        </RoleChecker>
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Sign in to continue
            </h2>
            <p className="text-muted-foreground max-w-md">
              Please sign in to access your dashboard and manage your files.
            </p>
          </div>
          <SignInButton mode="modal">
            <Button size="lg" className="bg-gradient-hero hover:opacity-90 transition-opacity">
              Sign In
            </Button>
          </SignInButton>
        </div>
      </SignedOut>
    </>
  );
}

interface RoleCheckerProps {
  children: React.ReactNode;
  user: any;
  isLoaded: boolean;
  requiredRole?: 'admin' | 'student';
  fallbackPath: string;
}

function RoleChecker({ children, user, isLoaded, requiredRole, fallbackPath }: RoleCheckerProps) {
  // Show loading state while user data is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no specific role is required, just render children
  if (!requiredRole) {
    return <>{children}</>;
  }

  // Check user role from publicMetadata
  const userRole = user?.publicMetadata?.role as string;
  
  // If user doesn't have the required role, redirect to fallback
  if (userRole !== requiredRole) {
    console.log(`Access denied: User role "${userRole}" does not match required role "${requiredRole}"`);
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}