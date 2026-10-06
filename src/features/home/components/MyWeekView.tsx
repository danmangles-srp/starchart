'use client';

import type { ReactNode } from 'react';
import NextLink from 'next/link';
import { format, parseISO } from 'date-fns';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import StatusChip from '@/components/StatusChip';
import EmptyState from '@/components/states/EmptyState';
import type { MyWeekData } from '../domain/home';
import { myWeekAttentionCount } from '../domain/home';

const MAX_ITEMS = 5;

function PanelCard({
  title,
  count,
  href,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  href?: string;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }} component="section" aria-label={title}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
        {href ? (
          <Link
            component={NextLink}
            href={href}
            variant="subtitle1"
            underline="hover"
            fontWeight={600}
          >
            {title}
          </Link>
        ) : (
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
        )}
        <Chip size="small" label={count} />
      </Stack>
      {count === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyText}
        </Typography>
      ) : (
        <Stack gap={0.75}>{children}</Stack>
      )}
    </Paper>
  );
}

function more(count: number): ReactNode {
  return count > MAX_ITEMS ? (
    <Typography variant="caption" color="text.secondary">
      +{count - MAX_ITEMS} more
    </Typography>
  ) : null;
}

export default function MyWeekView({ data }: { data: MyWeekData }) {
  const now = new Date();
  const attention = myWeekAttentionCount(data, now);
  const totalItems =
    data.rocks.length + data.todos.length + data.measurables.length + data.issues.length;

  if (totalItems === 0) {
    return (
      <Box>
        <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
          My Week
        </Typography>
        <EmptyState
          title="You’re all set"
          description="Nothing is assigned to you across your teams right now."
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1">
          My Week
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {attention > 0
            ? `${attention} item${attention === 1 ? '' : 's'} need attention`
            : 'Nothing urgent — nice'}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          alignItems: 'start',
        }}
      >
        <PanelCard title="My Rocks" count={data.rocks.length} emptyText="No Rocks this quarter.">
          {data.rocks.slice(0, MAX_ITEMS).map((r) => (
            <Stack
              key={r.id}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              gap={1}
            >
              {r.teamId ? (
                <Link
                  component={NextLink}
                  href={`/t/${r.teamId}/rocks`}
                  variant="body2"
                  underline="hover"
                  noWrap
                >
                  {r.title}
                </Link>
              ) : (
                <Typography variant="body2" noWrap>
                  {r.title}
                </Typography>
              )}
              <StatusChip status={r.status} />
            </Stack>
          ))}
          {more(data.rocks.length)}
        </PanelCard>

        <PanelCard
          title="My Todos"
          count={data.todos.length}
          href="/me/todos"
          emptyText="No open todos."
        >
          {data.todos.slice(0, MAX_ITEMS).map((t) => (
            <Stack
              key={t.id}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              gap={1}
            >
              <Link
                component={NextLink}
                href={`/t/${t.teamId}/todos`}
                variant="body2"
                underline="hover"
                noWrap
              >
                {t.title}
              </Link>
              <Typography variant="caption" color="text.secondary">
                {format(parseISO(t.dueDate), 'MMM d')}
              </Typography>
            </Stack>
          ))}
          {more(data.todos.length)}
        </PanelCard>

        <PanelCard
          title="Off-goal measurables"
          count={data.measurables.length}
          emptyText="Everything you own is on goal."
        >
          {data.measurables.slice(0, MAX_ITEMS).map((m) => (
            <Stack
              key={m.id}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              gap={1}
            >
              <Link
                component={NextLink}
                href={`/t/${m.teamId}/scorecard`}
                variant="body2"
                underline="hover"
                noWrap
              >
                {m.name}
              </Link>
              <Chip size="small" color="error" variant="outlined" label="off goal" />
            </Stack>
          ))}
          {more(data.measurables.length)}
        </PanelCard>

        <PanelCard
          title="My Issues"
          count={data.issues.length}
          emptyText="No issues assigned to you."
        >
          {data.issues.slice(0, MAX_ITEMS).map((i) => (
            <Link
              key={i.id}
              component={NextLink}
              href={`/t/${i.teamId}/issues`}
              variant="body2"
              underline="hover"
              noWrap
            >
              {i.title}
            </Link>
          ))}
          {more(data.issues.length)}
        </PanelCard>
      </Box>
    </Box>
  );
}
