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
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EmptyState from '@/components/states/EmptyState';
import type { IssueListType, IssueRow } from '../domain/issue';
import { createIssueAction, moveIssueAction, reorderIssuesAction } from '../server/actions';

const TOP_N = 3; // the top 3 short-term issues are emphasized (FR-5.3)

const FormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional(),
  listType: z.enum(['SHORT', 'LONG']),
  ownerId: z.string().optional(),
});
type FormValues = z.infer<typeof FormSchema>;

function openInList(items: IssueRow[], listType: IssueListType): IssueRow[] {
  return items.filter((i) => i.listType === listType && !i.solved).sort((a, b) => a.rank - b.rank);
}

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

  // Local copy for optimistic reorder/move (INV-5); re-seeded from the server on refresh.
  const [items, setItems] = useState(issues);
  const [prev, setPrev] = useState(issues);
  if (issues !== prev) {
    setPrev(issues);
    setItems(issues);
  }

  const short = useMemo(() => openInList(items, 'SHORT'), [items]);
  const long = useMemo(() => openInList(items, 'LONG'), [items]);

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

  function reorder(listType: IssueListType, orderedIds: string[]) {
    const previous = items;
    const rankOf = new Map(orderedIds.map((id, i) => [id, i + 1]));
    setItems((cur) => cur.map((i) => (rankOf.has(i.id) ? { ...i, rank: rankOf.get(i.id)! } : i)));
    setError(null);
    void (async () => {
      const res = await reorderIssuesAction({ teamId, listType, orderedIds });
      if (!res.ok) {
        setItems(previous);
        setError(res.message ?? 'Could not save the new order.');
        return;
      }
      router.refresh();
    })();
  }

  function move(issue: IssueRow, to: IssueListType) {
    const previous = items;
    const nextRank = openInList(items, to).length + 1;
    setItems((cur) =>
      cur.map((i) => (i.id === issue.id ? { ...i, listType: to, rank: nextRank } : i)),
    );
    setError(null);
    void (async () => {
      const res = await moveIssueAction({ issueId: issue.id, toListType: to });
      if (!res.ok) {
        setItems(previous);
        setError(res.message ?? 'Could not move the issue.');
        return;
      }
      router.refresh();
    })();
  }

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
            listType="SHORT"
            issues={short}
            emphasizeTop
            canEdit={canEdit}
            onAdd={() => openAdd('SHORT')}
            onReorder={reorder}
            onMove={move}
          />
          <IssueList
            heading="Long-term"
            hint="Parked for later"
            listType="LONG"
            issues={long}
            canEdit={canEdit}
            onAdd={() => openAdd('LONG')}
            onReorder={reorder}
            onMove={move}
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
  listType,
  issues,
  emphasizeTop = false,
  canEdit,
  onAdd,
  onReorder,
  onMove,
}: {
  heading: string;
  hint: string;
  listType: IssueListType;
  issues: IssueRow[];
  emphasizeTop?: boolean;
  canEdit: boolean;
  onAdd: () => void;
  onReorder: (listType: IssueListType, orderedIds: string[]) => void;
  onMove: (issue: IssueRow, to: IssueListType) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const other: IssueListType = listType === 'SHORT' ? 'LONG' : 'SHORT';

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = issues.findIndex((i) => i.id === active.id);
    const newIndex = issues.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(issues, oldIndex, newIndex);
    onReorder(
      listType,
      next.map((i) => i.id),
    );
  }

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <Stack gap={1}>
              {issues.map((issue, index) => (
                <SortableIssueCard
                  key={issue.id}
                  issue={issue}
                  emphasized={emphasizeTop && index < TOP_N}
                  rankBadge={index + 1}
                  canEdit={canEdit}
                  moveTo={other}
                  onMove={onMove}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}
    </Box>
  );
}

function SortableIssueCard({
  issue,
  emphasized,
  rankBadge,
  canEdit,
  moveTo,
  onMove,
}: {
  issue: IssueRow;
  emphasized: boolean;
  rankBadge: number;
  canEdit: boolean;
  moveTo: IssueListType;
  onMove: (issue: IssueRow, to: IssueListType) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: issue.id,
  });
  const moveLabel = moveTo === 'LONG' ? 'Move to long-term' : 'Move to short-term';
  return (
    <Paper
      ref={setNodeRef}
      variant="outlined"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      sx={{
        p: 1.5,
        borderLeft: emphasized ? '3px solid' : undefined,
        borderLeftColor: emphasized ? 'primary.main' : undefined,
      }}
    >
      <Stack direction="row" alignItems="flex-start" gap={1}>
        {canEdit ? (
          <IconButton
            size="small"
            aria-label={`Reorder ${issue.title}`}
            {...attributes}
            {...listeners}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        ) : null}
        {emphasized ? <Chip size="small" color="primary" label={`#${rankBadge}`} /> : null}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={emphasized ? 700 : 600}>
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
        {canEdit ? (
          <Tooltip title={moveLabel}>
            <IconButton
              size="small"
              aria-label={`${moveLabel}: ${issue.title}`}
              onClick={() => onMove(issue, moveTo)}
            >
              {moveTo === 'LONG' ? (
                <ArrowForwardIcon fontSize="small" />
              ) : (
                <ArrowBackIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        ) : null}
      </Stack>
    </Paper>
  );
}
