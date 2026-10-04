'use client';

import { signOut } from 'next-auth/react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';

/** Sign out and return to the sign-in screen (FR-1.4). */
export default function SignOutButton() {
  return (
    <Tooltip title="Sign out">
      <IconButton
        aria-label="Sign out"
        size="small"
        onClick={() => void signOut({ callbackUrl: '/sign-in' })}
      >
        <LogoutIcon />
      </IconButton>
    </Tooltip>
  );
}
