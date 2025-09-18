import { useAuth, useUser } from '@clerk/clerk-react';
import { useState } from 'react';

interface TokenInfo {
  header?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  tokenLength?: number;
  hasToken: boolean;
}

const AuthDebugger = () => {
  const { getToken, isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testToken = async () => {
    try {
      setError(null);
      console.log('🔍 Testing token retrieval...');
      
      const token = await getToken();
      console.log('Token result:', token ? 'Token received' : 'No token');
      
      if (token) {
        // Try to decode the JWT to see its contents (just the header and payload, not the signature)
        const parts = token.split('.');
        if (parts.length === 3) {
          const header = JSON.parse(atob(parts[0]));
          const payload = JSON.parse(atob(parts[1]));
          
          setTokenInfo({
            header,
            payload,
            tokenLength: token.length,
            hasToken: true
          });
        }
      } else {
        setTokenInfo({ hasToken: false });
      }
    } catch (err) {
      console.error('Token test error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px', backgroundColor: '#f9f9f9' }}>
      <h3>Authentication Debug</h3>
      <div>
        <p><strong>Auth Loaded:</strong> {authLoaded.toString()}</p>
        <p><strong>User Loaded:</strong> {userLoaded.toString()}</p>
        <p><strong>Is Signed In:</strong> {isSignedIn?.toString()}</p>
        <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
        <p><strong>User Email:</strong> {user?.primaryEmailAddress?.emailAddress || 'Not available'}</p>
      </div>
      
      <button onClick={testToken} style={{ margin: '10px 0', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
        Test Token Retrieval
      </button>
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {tokenInfo && (
        <div style={{ marginTop: '10px' }}>
          <h4>Token Info:</h4>
          <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(tokenInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AuthDebugger;