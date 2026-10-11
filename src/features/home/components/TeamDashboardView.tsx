'use client';

import type { ReactNode } from 'react';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import StatTile from '@/components/StatTile';
import type { TeamSummaries } from '../domain/home';

function ModuleCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }} component="section" aria-label={title}>
      <Link component={NextLink} href={href} variant="subtitle1" fontWeight={600} underline="hover">
        {title}
      </Link>
      <Box
        sx={{
          mt: 1.5,
          display: 'grid',
          gap: 1,
          gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr' },
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

export default function TeamDashboardView({
  teamId,
  teamName,
  data,
}: {
  teamId: string;
  teamName: string;
  data: TeamSummaries;
}) {
  const base = `/t/${teamId}`;
  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        {teamName}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          alignItems: 'start',
        }}
      >
        <ModuleCard title="Rocks" href={`${base}/rocks`}>
          <StatTile label="On track" value={data.rocks.onTrack} tone="success" />
          <StatTile label="At risk" value={data.rocks.atRisk} tone="warning" />
          <StatTile label="Off track" value={data.rocks.offTrack} tone="error" />
          <StatTile label="Done" value={data.rocks.done} />
        </ModuleCard>

        <ModuleCard title="Scorecard" href={`${base}/scorecard`}>
          <StatTile label="On goal" value={data.scorecard.onGoal} tone="success" />
          <StatTile label="Off goal" value={data.scorecard.offGoal} tone="error" />
          <StatTile label="No entry" value={data.scorecard.empty} />
        </ModuleCard>

        <ModuleCard title="Issues" href={`${base}/issues`}>
          <StatTile label="Short-term" value={data.issues.shortOpen} />
          <StatTile label="Long-term" value={data.issues.longOpen} />
          <StatTile label="Solved" value={data.issues.solved} tone="success" />
        </ModuleCard>

        <ModuleCard title="Todos" href={`${base}/todos`}>
          <StatTile label="Open" value={data.todos.open} />
          <StatTile label="Overdue" value={data.todos.overdue} tone="error" />
          <StatTile label="Done" value={data.todos.done} tone="success" />
        </ModuleCard>
      </Box>
    </Box>
  );
}
