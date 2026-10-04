'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/HomeOutlined';
import FlagIcon from '@mui/icons-material/FlagOutlined';
import TableChartIcon from '@mui/icons-material/TableChartOutlined';
import ReportProblemIcon from '@mui/icons-material/ReportProblemOutlined';
import ChecklistIcon from '@mui/icons-material/ChecklistOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { ComponentType } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import SignOutButton from '@/features/auth/components/SignOutButton';
import { MODULE_NAV, routes, type ModuleKey } from '@/lib/routes';

const DRAWER_WIDTH = 260;

const MODULE_ICON: Record<ModuleKey, ComponentType<SvgIconProps>> = {
  rocks: FlagIcon,
  scorecard: TableChartIcon,
  issues: ReportProblemIcon,
  todos: ChecklistIcon,
};

/**
 * App shell: top app bar + responsive left drawer (permanent on desktop,
 * temporary on tablet/phone — NFR-7.2). The drawer holds the team-switcher slot
 * (real in T1.4) and module nav; module links are disabled until a team is
 * active. Routes come from the INV-8 contract.
 */
export default function AppShell({
  children,
  activeTeamId = null,
}: {
  children: ReactNode;
  activeTeamId?: string | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="overline" color="text.secondary">
          Team
        </Typography>
        <Box
          sx={{
            mt: 0.5,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            color: 'text.secondary',
            fontSize: 14,
          }}
        >
          Team switcher (M1)
        </Box>
      </Box>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={NextLink} href={routes.home()} selected={pathname === '/'}>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="My Week" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      <List subheader={<ListSubheader component="div">Team</ListSubheader>}>
        {MODULE_NAV.map(({ key, label }) => {
          const Icon = MODULE_ICON[key];
          const href = activeTeamId ? routes.module(activeTeamId, key) : null;
          if (!href) {
            return (
              <ListItem key={key} disablePadding>
                <Tooltip title="Choose a team first" placement="right">
                  <Box component="span" sx={{ width: '100%' }}>
                    <ListItemButton disabled>
                      <ListItemIcon>
                        <Icon />
                      </ListItemIcon>
                      <ListItemText primary={label} />
                    </ListItemButton>
                  </Box>
                </Tooltip>
              </ListItem>
            );
          }
          return (
            <ListItem key={key} disablePadding>
              <ListItemButton component={NextLink} href={href} selected={pathname === href}>
                <ListItemIcon>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ mt: 'auto' }}>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              component={NextLink}
              href={routes.admin()}
              selected={pathname === '/admin'}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Admin" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            edge="start"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component={NextLink}
            href={routes.home()}
            sx={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}
          >
            Cadence
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <ThemeToggle />
          <Tooltip title="Profile (M1)">
            <Avatar sx={{ width: 32, height: 32, fontSize: 14 }} aria-label="Profile">
              U
            </Avatar>
          </Tooltip>
          <SignOutButton />
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        aria-label="Main navigation"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
