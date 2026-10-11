'use client';

import { useState } from 'react';
import NextLink from 'next/link';
import { signOut } from 'next-auth/react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import PersonIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import { routes } from '@/lib/routes';

export interface ViewerIdentity {
  name: string | null;
  email: string;
  image: string | null;
  jobTitle: string | null;
}

/** Two initials from a name or email, for the avatar fallback. */
function initials(identity: ViewerIdentity): string {
  const source = identity.name?.trim() || identity.email;
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return (letters || source[0] || '?').toUpperCase();
}

/**
 * App-bar identity (AC-1.3.1): the signed-in user's name + avatar (sourced from the
 * IdP), opening a menu with their profile link, optional job title, and sign-out
 * (FR-1.3 / FR-1.4). Replaces the placeholder "U" avatar.
 */
export default function ProfileMenu({ identity }: { identity: ViewerIdentity }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  const displayName = identity.name?.trim() || identity.email;

  return (
    <>
      <Tooltip title="Account">
        <IconButton
          onClick={(e) => setAnchor(e.currentTarget)}
          size="small"
          aria-label={`Account: ${displayName}`}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Avatar src={identity.image ?? undefined} sx={{ width: 32, height: 32, fontSize: 14 }}>
            {initials(identity)}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1, maxWidth: 260 }}>
          <Typography variant="subtitle2" noWrap>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {identity.jobTitle?.trim() || identity.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem component={NextLink} href={routes.profile()} onClick={() => setAnchor(null)}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => void signOut({ callbackUrl: '/sign-in' })}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
