import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Readonly<ProtectedRouteProps>) {
  return (
    <>
      <SignedIn>
        {children}
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