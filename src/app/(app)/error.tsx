'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

/**
 * App-group error boundary. Shows a plain-language message + retry; never a raw
 * stack (NFR-8/ui-ux). Detail is surfaced only in development.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 560 }}>
      <Typography variant="h5" component="h1">
        Something went wrong
      </Typography>
      <Typography color="text.secondary">
        We couldn&apos;t load this view. Try again, and if it keeps happening, let an admin know.
      </Typography>
      {process.env.NODE_ENV === 'development' && error.message ? (
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {error.message}
        </Typography>
      ) : null}
      <Box>
        <Button onClick={reset} variant="contained">
          Try again
        </Button>
      </Box>
    </Box>
  );
}
