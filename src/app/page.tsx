import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
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
      <ThemeToggle />
      <Typography variant="h3" component="h1">
        Cadence
      </Typography>
      <Typography color="text.secondary">Foundation ready. Features land next.</Typography>
    </Box>
  );
}
