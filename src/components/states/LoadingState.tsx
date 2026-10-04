import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

/** Skeleton loading state (INV-7) — mirrors list/table shape, announces busy. */
export default function LoadingState({
  rows = 3,
  label = 'Loading…',
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <Box
      role="status"
      aria-busy="true"
      aria-label={label}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={48} />
      ))}
    </Box>
  );
}
