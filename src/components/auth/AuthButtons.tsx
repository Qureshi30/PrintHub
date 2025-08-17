import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';

export default function AuthButtons() {
  return (
    <div className="flex items-center gap-3">
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="outline" size="sm" className="border-primary/20 hover:border-primary/40">
            Sign In
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm" className="bg-gradient-hero hover:opacity-90 transition-opacity">
            Sign Up
          </Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "h-8 w-8"
            }
          }}
        />
      </SignedIn>
    </div>
  );
}