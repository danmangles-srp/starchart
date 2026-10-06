'use client';

import { useState, type ReactNode } from 'react';
import { usePathname, useParams } from 'next/navigation';
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
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CalendarTodayIcon from '@mui/icons-material/CalendarTodayOutlined';
import { systemClock, timeAnchor } from '@/lib/time';
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
import TeamSwitcher from '@/features/org/components/TeamSwitcher';
import type { TeamSummaryRow } from '@/features/org/domain/teams';
import { MODULE_NAV, routes, type ModuleKey } from '@/lib/routes';

const DRAWER_WIDTH = 260;

/**
 * The shared "today" anchor (FR-7.3 / INV-4): the current calendar quarter + ISO week,
 * so Rocks (quarter) and Scorecard/Todos (week) read against one consistent context.
 * Historical browsing stays in-module (the Rocks quarter selector, the Scorecard pager).
 */
function TimeAnchorChip() {
  const a = timeAnchor(systemClock.now());
  return (
    <Tooltip title="Current quarter and week">
      <Chip
        size="small"
        variant="outlined"
        icon={<CalendarTodayIcon fontSize="small" />}
        // suppressHydrationWarning: at a quarter/week boundary the server and client
        // clocks can label differently; ignore that one-render diff rather than block render.
        label={<span suppressHydrationWarning>{`${a.quarterLabel} · ${a.isoWeekLabel}`}</span>}
        aria-label={`Today: ${a.quarterLabel}, week ${a.isoWeek}`}
        sx={{ display: { xs: 'none', sm: 'flex' } }}
      />
    </Tooltip>
  );
}

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
  teams = [],
}: {
  children: ReactNode;
  teams?: TeamSummaryRow[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams<{ teamId?: string }>();
  const activeTeamId = typeof params?.teamId === 'string' ? params.teamId : null;

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, py: 1.5 }}>
        <TeamSwitcher teams={teams} />
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
          <TimeAnchorChip />
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
