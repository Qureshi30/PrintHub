import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UserHeaderProps {
  user: any;
}

const UserHeader = ({ user }: UserHeaderProps) => {
  return (
    <div className="bg-white shadow-sm border-b px-6 py-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.firstName || user?.fullName || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            {user?.emailAddresses?.[0]?.emailAddress || 'No email provided'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {(user?.publicMetadata?.role as string) || 'student'}
          </span>
        </div>
      </div>
    </div>
  );
};

const RoleBasedDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const userRole = user.publicMetadata?.role as string;
      console.log('User role:', userRole);
      console.log('User metadata:', user.publicMetadata);
      
      // Only redirect if we're on the root paths
      if (location.pathname === '/' || location.pathname === '/dashboard') {
        if (userRole === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          // Default to student dashboard (you can create this route)
          navigate('/student/dashboard', { replace: true });
        }
      }
    }
  }, [isLoaded, isSignedIn, user, navigate, location.pathname]);

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle case where user is not signed in
  if (!isSignedIn || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  // Get user role from publicMetadata
  const userRole = user.publicMetadata?.role as string;
  
  console.log('User role:', userRole);
  console.log('User metadata:', user.publicMetadata);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default RoleBasedDashboard;
