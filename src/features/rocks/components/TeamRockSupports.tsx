import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

/** Back-link from a Team Rock to the Company Rock it supports (FR-3.4). Server-safe. */
export default function TeamRockSupports({
  teamId,
  company,
}: {
  teamId: string;
  company: { id: string; title: string };
}) {
  return (
    <Box sx={{ mt: 3, maxWidth: 680 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary">
        Supports Company Rock:{' '}
        <NextLink href={`/t/${teamId}/rocks/${company.id}`} style={{ color: 'inherit' }}>
          {company.title}
        </NextLink>
      </Typography>
    </Box>
  );
}
