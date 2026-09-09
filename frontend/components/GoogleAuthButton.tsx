'use client';

import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from '@react-oauth/google';

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function GoogleAuthButton({
  onSuccess,
  onError,
}: {
  onSuccess: (credentialResponse: CredentialResponse) => void;
  onError: () => void;
}) {
  if (!googleClientId) {
    return <span className="text-xs text-amber-400">Configura Google Auth</span>;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        theme="filled_black"
      />
    </GoogleOAuthProvider>
  );
}