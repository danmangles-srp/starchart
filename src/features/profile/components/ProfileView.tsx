'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import EmptyState from '@/components/states/EmptyState';
import { updateJobTitleAction } from '../server/actions';
import { UpdateJobTitleSchema, type UpdateJobTitleInput } from '../domain/schema';
import { displayRole } from '../domain/role';
import type { Profile } from '../data/profileRepo';

export default function ProfileView({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateJobTitleInput>({
    resolver: zodResolver(UpdateJobTitleSchema),
    defaultValues: { jobTitle: profile.jobTitle ?? '' },
  });

  const displayName = profile.name?.trim() || profile.email;
  const role = displayRole(profile);
  const jobTitleField = register('jobTitle');

  // Clear the saved/error banners as soon as the field is edited, so a success
  // message never lingers over a dirty, unsaved value.
  const clearBanners = () => {
    if (saved) setSaved(false);
    if (error) setError(null);
  };

  const submit = handleSubmit((values) => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateJobTitleAction({ jobTitle: values.jobTitle });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      reset({ jobTitle: result.data.jobTitle ?? '' });
      setSaved(true);
    });
  });

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
        Profile
      </Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar src={profile.image ?? undefined} sx={{ width: 56, height: 56 }}>
            {displayName[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {profile.email}
            </Typography>
            <Chip size="small" label={role} sx={{ mt: 0.5 }} />
          </Box>
        </Stack>

        <Box component="form" onSubmit={submit} sx={{ mt: 2 }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          {saved ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Job title saved.
            </Alert>
          ) : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
            <TextField
              label="Job title"
              placeholder="e.g. Head of Marketing"
              {...jobTitleField}
              onChange={(e) => {
                clearBanners();
                void jobTitleField.onChange(e);
              }}
              error={Boolean(errors.jobTitle)}
              helperText={errors.jobTitle?.message ?? 'Optional — shown in your account menu.'}
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={pending || !isDirty} sx={{ mt: 1 }}>
              Save
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Typography variant="h6" component="h2" sx={{ mt: 3, mb: 1 }}>
        Teams
      </Typography>
      {profile.memberships.length === 0 ? (
        <EmptyState
          title="No team memberships"
          description="You’re not on any team yet. An admin can add you from the admin console."
        />
      ) : (
        <Stack spacing={1} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {profile.memberships.map((m) => (
            <Paper
              key={m.teamId}
              variant="outlined"
              component="li"
              sx={{
                p: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {m.teamName}
                </Typography>
                {m.departmentName ? (
                  <Typography variant="caption" color="text.secondary">
                    {m.departmentName}
                  </Typography>
                ) : null}
              </Box>
              <Chip size="small" label={m.teamRole === 'LEAD' ? 'Lead' : 'Member'} />
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
