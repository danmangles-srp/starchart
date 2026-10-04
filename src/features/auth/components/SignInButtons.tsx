'use client';

import { signIn } from 'next-auth/react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import GoogleIcon from '@mui/icons-material/Google';
import WindowIcon from '@mui/icons-material/Window';

/** The two sign-in actions (FR-1.1 / AC-1.1.1). Nothing else on the screen. */
export default function SignInButtons() {
  return (
    <Stack spacing={1.5} sx={{ width: '100%', maxWidth: 320 }}>
      <Button
        size="large"
        variant="contained"
        startIcon={<GoogleIcon />}
        onClick={() => void signIn('google', { callbackUrl: '/' })}
      >
        Sign in with Google
      </Button>
      <Button
        size="large"
        variant="outlined"
        startIcon={<WindowIcon />}
        onClick={() => void signIn('microsoft-entra-id', { callbackUrl: '/' })}
      >
        Sign in with Microsoft
      </Button>
    </Stack>
  );
}
