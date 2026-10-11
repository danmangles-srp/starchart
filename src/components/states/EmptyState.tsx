import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/InboxOutlined';

/** Inviting empty state (INV-7) — a calm icon + welcome + one clear action, never a blank page. */
export default function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** A decorative lead icon; defaults to an inbox. */
  icon?: ReactNode;
}) {
  return (
    <Box
      role="region"
      aria-label={title}
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
      <Box aria-hidden sx={{ color: 'text.disabled', '& > svg': { fontSize: 48 }, lineHeight: 0 }}>
        {icon ?? <InboxIcon />}
      </Box>
      <Typography variant="h6" component="p">
        {title}
      </Typography>
      {description ? (
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      ) : null}
      {action}
    </Box>
  );
}
