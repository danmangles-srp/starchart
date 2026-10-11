'use client';

import type { ReactNode } from 'react';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { TeamSummaries } from '../domain/home';

/** A count with a text label (never color alone, INV-6). `tone` adds a semantic chip color. */
function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'success' | 'error' | 'warning';
}) {
  return (
    <Chip size="small" variant="outlined" color={tone ?? 'default'} label={`${label}: ${value}`} />
  );
}

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
      <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
        {children}
      </Stack>
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
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          alignItems: 'start',
        }}
      >
        <ModuleCard title="Rocks" href={`${base}/rocks`}>
          <Stat label="On track" value={data.rocks.onTrack} tone="success" />
          <Stat label="At risk" value={data.rocks.atRisk} tone="warning" />
          <Stat label="Off track" value={data.rocks.offTrack} tone="error" />
          <Stat label="Done" value={data.rocks.done} />
        </ModuleCard>

        <ModuleCard title="Scorecard" href={`${base}/scorecard`}>
          <Stat label="On goal" value={data.scorecard.onGoal} tone="success" />
          <Stat label="Off goal" value={data.scorecard.offGoal} tone="error" />
          <Stat label="No entry" value={data.scorecard.empty} />
        </ModuleCard>

        <ModuleCard title="Issues" href={`${base}/issues`}>
          <Stat label="Short-term" value={data.issues.shortOpen} />
          <Stat label="Long-term" value={data.issues.longOpen} />
          <Stat label="Solved" value={data.issues.solved} tone="success" />
        </ModuleCard>

        <ModuleCard title="Todos" href={`${base}/todos`}>
          <Stat label="Open" value={data.todos.open} />
          <Stat label="Overdue" value={data.todos.overdue} tone="error" />
          <Stat label="Done" value={data.todos.done} tone="success" />
        </ModuleCard>
      </Box>
    </Box>
  );
}
