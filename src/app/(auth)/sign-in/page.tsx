import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SignInButtons from '@/features/auth/components/SignInButtons';

export default function SignInPage() {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Stack spacing={4} alignItems="center" sx={{ textAlign: 'center' }}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h3" component="h1">
            Cadence
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 360 }}>
            Run your team&apos;s EOS operations — Rocks, Scorecard, Issues, and Todos.
          </Typography>
        </Stack>
        <SignInButtons />
        <Typography variant="caption" color="text.secondary">
          Use your company Google or Microsoft account.
        </Typography>
      </Stack>
    </Box>
  );
}
