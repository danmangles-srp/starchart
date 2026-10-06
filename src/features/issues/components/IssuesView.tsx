'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import EmptyState from '@/components/states/EmptyState';
import type { IssueListType, IssueRow } from '../domain/issue';
import { createIssueAction } from '../server/actions';

const TOP_N = 3; // the top 3 short-term issues are emphasized (FR-5.3)

const FormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  listType: z.enum(['SHORT', 'LONG']),
  ownerId: z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

export default function IssuesView({
  teamId,
  issues,
  members,
  canEdit,
}: {
  teamId: string;
  issues: IssueRow[];
  members: { userId: string; name: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [dialogFor, setDialogFor] = useState<IssueListType | null>(null);

  const short = useMemo(() => issues.filter((i) => i.listType === 'SHORT' && !i.solved), [issues]);
  const long = useMemo(() => issues.filter((i) => i.listType === 'LONG' && !i.solved), [issues]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { title: '', description: '', listType: 'SHORT', ownerId: '' },
  });

  function openAdd(listType: IssueListType) {
    reset({ title: '', description: '', listType, ownerId: '' });
    setError(null);
    setDialogFor(listType);
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const res = await createIssueAction({
      teamId,
      title: values.title,
      description: values.description?.trim() ? values.description.trim() : null,
      ownerId: values.ownerId ? values.ownerId : null,
      listType: values.listType,
    });
    if (!res.ok) {
      setError(res.message ?? 'Could not add the issue.');
      return;
    }
    setDialogFor(null);
    router.refresh();
  });

  const empty = short.length === 0 && long.length === 0;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1">
          Issues
        </Typography>
      </Stack>

      {empty ? (
        <EmptyState
          title="No issues yet"
          description="Capture what's getting in the way — short-term to work this week, long-term to park."
          action={
            canEdit ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openAdd('SHORT')}>
                Raise an issue
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            alignItems: 'start',
          }}
        >
          <IssueList
            heading="Short-term"
            hint="Work these now"
            issues={short}
            emphasizeTop
            canEdit={canEdit}
            onAdd={() => openAdd('SHORT')}
          />
          <IssueList
            heading="Long-term"
            hint="Parked for later"
            issues={long}
            canEdit={canEdit}
            onAdd={() => openAdd('LONG')}
          />
        </Box>
      )}

      <Dialog open={dialogFor !== null} onClose={() => setDialogFor(null)} fullWidth maxWidth="sm">
        <DialogTitle>Raise a {dialogFor === 'LONG' ? 'long-term' : 'short-term'} issue</DialogTitle>
        <Box component="form" onSubmit={onSubmit} noValidate>
          <DialogContent dividers>
            <Stack gap={2}>
              <TextField
                label="Title"
                size="small"
                fullWidth
                autoFocus
                {...register('title')}
                error={!!errors.title}
                helperText={errors.title?.message}
              />
              <TextField
                label="Description (optional)"
                size="small"
                fullWidth
                multiline
                {...register('description')}
              />
              <Controller
                control={control}
                name="listType"
                render={({ field }) => (
                  <TextField select label="List" size="small" fullWidth {...field}>
                    <MenuItem value="SHORT">Short-term</MenuItem>
                    <MenuItem value="LONG">Long-term</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                control={control}
                name="ownerId"
                render={({ field }) => (
                  <TextField select label="Owner (optional)" size="small" fullWidth {...field}>
                    <MenuItem value="">Unassigned</MenuItem>
                    {members.map((m) => (
                      <MenuItem key={m.userId} value={m.userId}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogFor(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Add
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={error !== null}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function IssueList({
  heading,
  hint,
  issues,
  emphasizeTop = false,
  canEdit,
  onAdd,
}: {
  heading: string;
  hint: string;
  issues: IssueRow[];
  emphasizeTop?: boolean;
  canEdit: boolean;
  onAdd: () => void;
}) {
  return (
    <Box component="section" aria-label={heading}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {heading} ({issues.length})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        </Box>
        {canEdit ? (
          <Button size="small" startIcon={<AddIcon />} onClick={onAdd}>
            Add
          </Button>
        ) : null}
      </Stack>
      {issues.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          Nothing here yet.
        </Typography>
      ) : (
        <Stack gap={1}>
          {issues.map((issue, index) => {
            const top = emphasizeTop && index < TOP_N;
            return (
              <Paper
                key={issue.id}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderLeft: top ? '3px solid' : undefined,
                  borderLeftColor: top ? 'primary.main' : undefined,
                }}
              >
                <Stack direction="row" alignItems="flex-start" gap={1}>
                  {top ? <Chip size="small" color="primary" label={`#${index + 1}`} /> : null}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={top ? 700 : 600}>
                      {issue.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      raised by {issue.raiserName}
                      {issue.ownerName ? ` · owner ${issue.ownerName}` : ''}
                    </Typography>
                    {issue.description ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {issue.description}
                      </Typography>
                    ) : null}
                  </Box>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
