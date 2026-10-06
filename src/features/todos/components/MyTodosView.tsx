'use client';

import { useMemo, useState } from 'react';
import NextLink from 'next/link';
import { format, parseISO } from 'date-fns';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import OpenInNewIcon from '@mui/icons-material/NorthEast';
import EmptyState from '@/components/states/EmptyState';
import { overdueLabel, type TodoRow } from '../domain/todo';
import { groupMyTodos, overdueTotal } from '../domain/myTodos';

function dueLabel(iso: string): string {
  return format(parseISO(iso), 'MMM d');
}

export default function MyTodosView({
  todos,
  teams,
}: {
  todos: TodoRow[];
  teams: { id: string; name: string }[];
}) {
  const now = useMemo(() => new Date(), []);
  const [team, setTeam] = useState<string>('all');

  const groups = useMemo(() => {
    const nameOf = (id: string) => teams.find((t) => t.id === id)?.name ?? 'Unknown team';
    return groupMyTodos(todos, nameOf, now);
  }, [todos, teams, now]);
  const shown = team === 'all' ? groups : groups.filter((g) => g.teamId === team);
  const overdue = overdueTotal(todos, now);

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
      >
        <Box>
          <Typography variant="h5" component="h1">
            My Todos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {todos.length} open across your teams
            {overdue > 0 ? ` · ${overdue} overdue` : ''}
          </Typography>
        </Box>
        {groups.length > 1 ? (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="my-todos-team">Team</InputLabel>
            <Select
              labelId="my-todos-team"
              label="Team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            >
              <MenuItem value="all">All teams</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g.teamId} value={g.teamId}>
                  {g.teamName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </Stack>

      {todos.length === 0 ? (
        <EmptyState
          title="You’re all caught up"
          description="You have no open todos across your teams."
        />
      ) : (
        <Stack gap={3}>
          {shown.map((g) => (
            <Box key={g.teamId} component="section" aria-label={g.teamName}>
              <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
                <Link
                  component={NextLink}
                  href={`/t/${g.teamId}/todos`}
                  variant="subtitle2"
                  underline="hover"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                >
                  {g.teamName}
                  <OpenInNewIcon sx={{ fontSize: 14 }} />
                </Link>
                {g.overdueCount > 0 ? (
                  <Chip
                    size="small"
                    color="error"
                    variant="outlined"
                    icon={<WarningAmberIcon fontSize="small" />}
                    label={`${g.overdueCount} overdue`}
                  />
                ) : null}
              </Stack>
              <Stack gap={1}>
                {g.items.map((t) => {
                  const od = overdueLabel(parseISO(t.dueDate), t.done, now);
                  return (
                    <Paper key={t.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={1}
                      >
                        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 0 }}>
                          {t.title}
                        </Typography>
                        <Stack direction="row" alignItems="center" gap={1}>
                          {od ? (
                            <Chip
                              size="small"
                              color="error"
                              variant="outlined"
                              icon={<WarningAmberIcon fontSize="small" />}
                              label={od}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              due {dueLabel(t.dueDate)}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
