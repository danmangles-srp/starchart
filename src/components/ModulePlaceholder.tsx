import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * Temporary module landing used until a real screen lands. Keeps the shell
 * navigable and each route rendering real content (not a blank page).
 */
export default function ModulePlaceholder({ title, note }: { title: string; note: string }) {
  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary">{note}</Typography>
    </Box>
  );
}
