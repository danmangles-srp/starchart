'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import NextLink from 'next/link';

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h3" component="h1">
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
        That page doesn&apos;t exist, or you don&apos;t have access to it.
      </Typography>
      <Button component={NextLink} href="/" variant="contained">
        Back to My Week
      </Button>
    </Box>
  );
}
