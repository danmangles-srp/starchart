'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

/** Plain-language error state (INV-7) with an optional Retry — never a raw stack. */
export default function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Box
      role="alert"
      sx={{
        textAlign: 'center',
        py: 6,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Typography variant="h6" component="p">
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
        {description}
      </Typography>
      {onRetry ? (
        <Button onClick={onRetry} variant="outlined">
          Retry
        </Button>
      ) : null}
    </Box>
  );
}
