/**
 * Map an Auth.js `?error=` code to a plain-language message for the sign-in screen
 * (AC-1.1.3). Pure — no React/Next. Returns null when there is no error to show.
 */
export function signInErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case 'AccessDenied':
      return "That account isn't on an allowed company domain or tenant. Sign in with your work Google or Microsoft account.";
    case 'Verification':
      return 'That sign-in link has expired or was already used. Please try again.';
    default:
      // Configuration / OAuthSignin / OAuthCallback / etc. — don't leak internals.
      return 'Something went wrong signing in. Please try again.';
  }
}
