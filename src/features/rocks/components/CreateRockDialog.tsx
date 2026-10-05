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

const FormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  description: z.string().trim().max(2000).optional(),
  ownerId: z.string().min(1, 'Choose an owner'),
  level: z.enum(['COMPANY', 'TEAM', 'INDIVIDUAL']),
  dueDate: z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

export default function CreateRockDialog({
  open,
  onClose,
  teamId,
  members,
  quarter,
}: {
  open: boolean;
  onClose: () => void;
  teamId: string;
  members: { userId: string; name: string }[];
  quarter: QuarterKey;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
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
      ownerId: members[0]?.userId ?? '',
      level: 'TEAM',
      dueDate: '',
    },
  });

  const noMembers = members.length === 0;

  const submit = handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await createRockAction({
        title: values.title,
        description: values.description || undefined,
        ownerId: values.ownerId,
        level: values.level,
        teamId: values.level === 'TEAM' ? teamId : null,
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
            {noMembers ? (
              <Alert severity="info">
                This team has no members yet — add one in Admin before creating a Rock.
              </Alert>
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
            <Controller
              name="level"
              control={control}
              render={({ field }) => (
                <TextField select label="Level" {...field} fullWidth>
                  <MenuItem value="TEAM">Team</MenuItem>
                  <MenuItem value="COMPANY">Company</MenuItem>
                  <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                </TextField>
              )}
            />
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
          <Button type="submit" variant="contained" disabled={pending || noMembers}>
            Add Rock
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
