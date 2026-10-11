'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { createRockAction } from '../server/actions';
import type { QuarterKey } from '../domain/quarter';
import type { RockLevel } from '../domain/rock';

const LEVEL_LABEL: Record<RockLevel, string> = {
  COMPANY: 'Company',
  TEAM: 'Team',
  INDIVIDUAL: 'Individual',
};

const FormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  description: z.string().trim().max(2000).optional(),
  ownerId: z.string().min(1, 'Choose an owner'),
  level: z.enum(['COMPANY', 'TEAM', 'INDIVIDUAL']),
  dueDate: z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

/**
 * Add a Rock. The Level options are gated to what the viewer may actually create
 * in this context (T8.4 / finding B1) so no offered option is a guaranteed
 * `forbidden`. In personal mode a `fixedOwner` is supplied (the owner is the
 * viewer themselves) and the owner picker is hidden.
 */
export default function CreateRockDialog({
  open,
  onClose,
  allowedLevels,
  teamId,
  members = [],
  fixedOwner,
  quarter,
}: {
  open: boolean;
  onClose: () => void;
  allowedLevels: RockLevel[];
  teamId?: string;
  members?: { userId: string; name: string }[];
  fixedOwner?: { userId: string; name: string };
  quarter: QuarterKey;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const defaultLevel: RockLevel = allowedLevels[0] ?? 'TEAM';
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
      description: '',
      ownerId: fixedOwner?.userId ?? members[0]?.userId ?? '',
      level: defaultLevel,
      dueDate: '',
    },
  });

  // In team mode we need at least one member to own the Rock; personal mode always
  // owns to the viewer, and no level available means nothing can be created here.
  const noOwner = !fixedOwner && members.length === 0;
  const noLevel = allowedLevels.length === 0;
  const blocked = noOwner || noLevel;

  const submit = handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await createRockAction({
        title: values.title,
        description: values.description || undefined,
        ownerId: fixedOwner?.userId ?? values.ownerId,
        level: values.level,
        teamId: values.level === 'TEAM' ? (teamId ?? null) : null,
        fiscalYear: quarter.fiscalYear,
        quarterIndex: quarter.quarterIndex,
        dueDate: values.dueDate || undefined,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      reset();
      onClose();
      router.refresh();
    });
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add a Rock</DialogTitle>
      <form onSubmit={submit}>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {noOwner ? (
              <Alert severity="info">
                This team has no members yet — add one in Admin before creating a Rock.
              </Alert>
            ) : null}
            {noLevel ? (
              <Alert severity="info">You don’t have permission to create a Rock here.</Alert>
            ) : null}
            <TextField
              label="Title"
              {...register('title')}
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
              autoFocus
              fullWidth
            />
            <TextField
              label="Description"
              {...register('description')}
              multiline
              minRows={2}
              fullWidth
            />
            {fixedOwner ? (
              <TextField label="Owner" value={fixedOwner.name} fullWidth disabled />
            ) : (
              <Controller
                name="ownerId"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Owner"
                    {...field}
                    error={Boolean(errors.ownerId)}
                    helperText={errors.ownerId?.message}
                    fullWidth
                  >
                    {members.map((m) => (
                      <MenuItem key={m.userId} value={m.userId}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            )}
            {allowedLevels.length > 1 ? (
              <Controller
                name="level"
                control={control}
                render={({ field }) => (
                  <TextField select label="Level" {...field} fullWidth>
                    {allowedLevels.map((l) => (
                      <MenuItem key={l} value={l}>
                        {LEVEL_LABEL[l]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            ) : null}
            <TextField
              label="Due date"
              type="date"
              {...register('dueDate')}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={pending || blocked}>
            Add Rock
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
