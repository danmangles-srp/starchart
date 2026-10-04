'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { ActionResult } from '@/lib/auth/errors';
import {
  createTeamAction,
  archiveTeamAction,
  addMembershipAction,
  removeMembershipAction,
  setUserAdminAction,
  upsertQuarterAction,
} from '@/features/admin/server/actions';

export interface AdminData {
  teams: {
    id: string;
    name: string;
    isLeadership: boolean;
    departmentId: string | null;
    archivedAt: string | null;
  }[];
  departments: { id: string; name: string }[];
  users: {
    id: string;
    email: string;
    name: string | null;
    isAdmin: boolean;
    memberships: { teamId: string; teamRole: 'LEAD' | 'MEMBER' }[];
  }[];
  quarters: {
    id: string;
    fiscalYear: number;
    index: number;
    label: string;
    startsOn: string;
    endsOn: string;
  }[];
}

export default function AdminConsole({ data }: { data: AdminData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    run: () => Promise<ActionResult<unknown>>;
  } | null>(null);

  const run = (action: () => Promise<ActionResult<unknown>>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.message);
      else router.refresh();
    });
  };

  const activeTeams = data.teams.filter((t) => !t.archivedAt);
  const teamName = (id: string) => data.teams.find((t) => t.id === id)?.name ?? id;

  return (
    <Box sx={{ maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Typography variant="h4" component="h1">
        Admin
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <TeamsSection
        departments={data.departments}
        teams={activeTeams}
        pending={pending}
        onCreate={(name, departmentId) =>
          run(() => createTeamAction({ name, departmentId: departmentId || null }))
        }
        onArchive={(team) =>
          setConfirm({
            title: `Archive ${team.name}?`,
            message:
              'The team is hidden everywhere but its history is kept. This can be reversed by an admin.',
            run: () => archiveTeamAction({ teamId: team.id }),
          })
        }
      />

      <Divider />

      <UsersSection
        users={data.users}
        teams={activeTeams}
        pending={pending}
        teamName={teamName}
        onToggleAdmin={(userId, isAdmin) => run(() => setUserAdminAction({ userId, isAdmin }))}
        onAddMembership={(userId, teamId, teamRole) =>
          run(() => addMembershipAction({ userId, teamId, teamRole }))
        }
        onRemoveMembership={(userId, teamId) =>
          setConfirm({
            title: 'Remove member?',
            message: 'They lose access to this team immediately.',
            run: () => removeMembershipAction({ userId, teamId }),
          })
        }
      />

      <Divider />

      <QuartersSection
        quarters={data.quarters}
        pending={pending}
        onUpsert={(q) => run(() => upsertQuarterAction(q))}
      />

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ''}
        message={confirm?.message ?? ''}
        confirmLabel="Confirm"
        destructive
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const action = confirm?.run;
          setConfirm(null);
          if (action) run(action);
        }}
      />
    </Box>
  );
}

function TeamsSection({
  departments,
  teams,
  pending,
  onCreate,
  onArchive,
}: {
  departments: AdminData['departments'];
  teams: AdminData['teams'];
  pending: boolean;
  onCreate: (name: string, departmentId: string) => void;
  onArchive: (team: AdminData['teams'][number]) => void;
}) {
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  return (
    <section>
      <Typography variant="h6" gutterBottom>
        Teams
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            onCreate(name.trim(), departmentId);
            setName('');
          }
        }}
        sx={{ mb: 2 }}
      >
        <TextField
          size="small"
          label="New team name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="dept-label">Department</InputLabel>
          <Select
            labelId="dept-label"
            label="Department"
            value={departmentId}
            displayEmpty
            onChange={(e) => setDepartmentId(e.target.value)}
          >
            <MenuItem value="">None (Leadership)</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button type="submit" variant="contained" disabled={pending || !name.trim()}>
          Add team
        </Button>
      </Stack>
      <Stack spacing={0.5}>
        {teams.map((team) => (
          <Stack key={team.id} direction="row" alignItems="center" justifyContent="space-between">
            <Typography>{team.name}</Typography>
            {team.isLeadership ? (
              <Chip size="small" label="Leadership" />
            ) : (
              <Button size="small" color="error" disabled={pending} onClick={() => onArchive(team)}>
                Archive
              </Button>
            )}
          </Stack>
        ))}
      </Stack>
    </section>
  );
}

function UsersSection({
  users,
  teams,
  pending,
  teamName,
  onToggleAdmin,
  onAddMembership,
  onRemoveMembership,
}: {
  users: AdminData['users'];
  teams: AdminData['teams'];
  pending: boolean;
  teamName: (id: string) => string;
  onToggleAdmin: (userId: string, isAdmin: boolean) => void;
  onAddMembership: (userId: string, teamId: string, teamRole: 'LEAD' | 'MEMBER') => void;
  onRemoveMembership: (userId: string, teamId: string) => void;
}) {
  return (
    <section>
      <Typography variant="h6" gutterBottom>
        People &amp; roles
      </Typography>
      <Stack spacing={2}>
        {users.map((user) => (
          <Box key={user.id}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
            >
              <Box>
                <Typography>{user.name ?? user.email}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={user.isAdmin}
                    disabled={pending}
                    onChange={(e) => onToggleAdmin(user.id, e.target.checked)}
                  />
                }
                label="Admin"
              />
            </Stack>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
              {user.memberships.map((m) => (
                <Chip
                  key={m.teamId}
                  size="small"
                  label={`${teamName(m.teamId)} · ${m.teamRole}`}
                  onDelete={pending ? undefined : () => onRemoveMembership(user.id, m.teamId)}
                />
              ))}
            </Stack>
            <AddMembershipForm
              teams={teams}
              pending={pending}
              onAdd={(teamId, role) => onAddMembership(user.id, teamId, role)}
            />
          </Box>
        ))}
      </Stack>
    </section>
  );
}

function AddMembershipForm({
  teams,
  pending,
  onAdd,
}: {
  teams: AdminData['teams'];
  pending: boolean;
  onAdd: (teamId: string, role: 'LEAD' | 'MEMBER') => void;
}) {
  const [teamId, setTeamId] = useState('');
  const [role, setRole] = useState<'LEAD' | 'MEMBER'>('MEMBER');
  return (
    <Stack
      direction="row"
      spacing={1}
      component="form"
      sx={{ mt: 1 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (teamId) onAdd(teamId, role);
      }}
    >
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id={`add-team-label`}>Add to team</InputLabel>
        <Select
          labelId="add-team-label"
          label="Add to team"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        >
          {teams.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 110 }}>
        <InputLabel id="add-role-label">Role</InputLabel>
        <Select
          labelId="add-role-label"
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'LEAD' | 'MEMBER')}
        >
          <MenuItem value="MEMBER">Member</MenuItem>
          <MenuItem value="LEAD">Lead</MenuItem>
        </Select>
      </FormControl>
      <Button type="submit" size="small" disabled={pending || !teamId}>
        Add
      </Button>
    </Stack>
  );
}

function QuartersSection({
  quarters,
  pending,
  onUpsert,
}: {
  quarters: AdminData['quarters'];
  pending: boolean;
  onUpsert: (q: {
    fiscalYear: number;
    index: number;
    label: string;
    startsOn: string;
    endsOn: string;
  }) => void;
}) {
  const [fiscalYear, setFiscalYear] = useState(new Date().getUTCFullYear());
  const [index, setIndex] = useState(1);
  const [label, setLabel] = useState('');
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');

  return (
    <section>
      <Typography variant="h6" gutterBottom>
        Quarter definitions
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        {quarters.map((q) => (
          <Typography key={q.id} variant="body2">
            {q.label}: {q.startsOn} → {q.endsOn}
          </Typography>
        ))}
      </Stack>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        component="form"
        flexWrap="wrap"
        useFlexGap
        onSubmit={(e) => {
          e.preventDefault();
          if (label.trim() && startsOn && endsOn) {
            onUpsert({ fiscalYear, index, label: label.trim(), startsOn, endsOn });
          }
        }}
      >
        <TextField
          size="small"
          label="Year"
          type="number"
          value={fiscalYear}
          onChange={(e) => setFiscalYear(Number(e.target.value))}
          sx={{ width: 100 }}
        />
        <TextField
          size="small"
          label="Q#"
          type="number"
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          sx={{ width: 80 }}
        />
        <TextField
          size="small"
          label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <TextField
          size="small"
          label="Starts"
          type="date"
          value={startsOn}
          onChange={(e) => setStartsOn(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          size="small"
          label="Ends"
          type="date"
          value={endsOn}
          onChange={(e) => setEndsOn(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button type="submit" variant="contained" disabled={pending}>
          Save quarter
        </Button>
      </Stack>
    </section>
  );
}
