'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
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
import { MeasurableFieldsSchema } from '../domain/schemas';
import type { Comparator, MeasurableFormat } from '../domain/measurable';
import type { ScorecardRowVM } from '../domain/viewModel';
import {
  archiveMeasurableAction,
  createMeasurableAction,
  reorderMeasurablesAction,
  updateMeasurableAction,
} from '../server/actions';

type FormValues = z.infer<typeof MeasurableFieldsSchema>;

const COMPARATORS: { value: Comparator; label: string }[] = [
  { value: 'GTE', label: '≥ at least' },
  { value: 'LTE', label: '≤ at most' },
  { value: 'EQ', label: '= exactly' },
  { value: 'GT', label: '> greater than' },
  { value: 'LT', label: '< less than' },
  { value: 'BETWEEN', label: 'between' },
];
const FORMATS: { value: MeasurableFormat; label: string }[] = [
  { value: 'NUMBER', label: 'Number' },
  { value: 'PERCENT', label: 'Percent' },
  { value: 'CURRENCY', label: 'Currency' },
  { value: 'TIME', label: 'Time' },
];

function SortableRow({
  row,
  onEdit,
  onArchive,
}: {
  row: ScorecardRowVM;
  onEdit: (row: ScorecardRowVM) => void;
  onArchive: (row: ScorecardRowVM) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.id });
  const [confirming, setConfirming] = useState(false);
  return (
    <Stack
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      direction="row"
      alignItems="center"
      gap={1}
      sx={{ py: 0.5 }}
    >
      <IconButton size="small" aria-label={`Reorder ${row.name}`} {...attributes} {...listeners}>
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {row.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {row.ownerName} · {row.goalLabel}
        </Typography>
      </Box>
      {confirming ? (
        <>
          <Button size="small" color="error" onClick={() => onArchive(row)}>
            Confirm
          </Button>
          <Button size="small" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </>
      ) : (
        <>
          <IconButton size="small" aria-label={`Edit ${row.name}`} onClick={() => onEdit(row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            aria-label={`Archive ${row.name}`}
            onClick={() => setConfirming(true)}
          >
            <ArchiveIcon fontSize="small" />
          </IconButton>
        </>
      )}
    </Stack>
  );
}

export default function ManageMeasurablesDialog({
  open,
  onClose,
  teamId,
  rows,
  members,
}: {
  open: boolean;
  onClose: () => void;
  teamId: string;
  rows: ScorecardRowVM[];
  members: { userId: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Local order, re-seeded from the server after each refresh (render-time resync).
  const [order, setOrder] = useState(rows);
  const [prevRows, setPrevRows] = useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setOrder(rows);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(MeasurableFieldsSchema),
    defaultValues: {
      name: '',
      ownerId: members[0]?.userId ?? '',
      goalValue: 0,
      goalMax: null,
      comparator: 'GTE',
      format: 'NUMBER',
      unit: '',
    },
  });
  const comparator = watch('comparator');

  const title = useMemo(() => (editingId ? 'Edit measurable' : 'Add a measurable'), [editingId]);

  function startEdit(row: ScorecardRowVM) {
    setEditingId(row.id);
    setError(null);
    reset({
      name: row.name,
      ownerId: row.ownerId,
      goalValue: row.goalValue,
      goalMax: row.goalMax,
      comparator: row.comparator,
      format: row.format,
      unit: row.unit ?? '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    reset({
      name: '',
      ownerId: members[0]?.userId ?? '',
      goalValue: 0,
      goalMax: null,
      comparator: 'GTE',
      format: 'NUMBER',
      unit: '',
    });
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const payload = {
      ...values,
      goalMax: values.comparator === 'BETWEEN' ? (values.goalMax ?? null) : null,
      unit: values.unit?.trim() ? values.unit.trim() : null,
    };
    const res = editingId
      ? await updateMeasurableAction({ measurableId: editingId, ...payload })
      : await createMeasurableAction({ teamId, ...payload });
    if (!res.ok) {
      setError(res.message ?? 'Could not save the measurable.');
      return;
    }
    cancelEdit();
    router.refresh();
  });

  function archive(row: ScorecardRowVM) {
    setError(null);
    startTransition(async () => {
      const res = await archiveMeasurableAction({ measurableId: row.id });
      if (!res.ok) {
        setError(res.message ?? 'Could not archive the measurable.');
        return;
      }
      if (editingId === row.id) cancelEdit();
      router.refresh();
    });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((r) => r.id === active.id);
    const newIndex = order.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const previous = order;
    const next = arrayMove(order, oldIndex, newIndex);
    setOrder(next);
    startTransition(async () => {
      const res = await reorderMeasurablesAction({
        teamId,
        orderedIds: next.map((r) => r.id),
      });
      if (!res.ok) {
        setOrder(previous);
        setError(res.message ?? 'Could not save the new order.');
      }
    });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage measurables</DialogTitle>
      <DialogContent dividers>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {order.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No measurables yet — add the first one below.
          </Typography>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={order.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <Stack divider={<Divider flexItem />}>
                {order.map((row) => (
                  <SortableRow key={row.id} row={row} onEdit={startEdit} onArchive={archive} />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack gap={2}>
            <TextField
              label="Name"
              size="small"
              fullWidth
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <Controller
              control={control}
              name="ownerId"
              render={({ field }) => (
                <TextField
                  select
                  label="Owner"
                  size="small"
                  fullWidth
                  {...field}
                  error={!!errors.ownerId}
                  helperText={errors.ownerId?.message}
                >
                  {members.map((m) => (
                    <MenuItem key={m.userId} value={m.userId}>
                      {m.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Stack direction="row" gap={2}>
              <Controller
                control={control}
                name="comparator"
                render={({ field }) => (
                  <TextField select label="Goal" size="small" fullWidth {...field}>
                    {COMPARATORS.map((c) => (
                      <MenuItem key={c.value} value={c.value}>
                        {c.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField
                label={comparator === 'BETWEEN' ? 'Lower bound' : 'Target'}
                type="number"
                size="small"
                fullWidth
                {...register('goalValue', { valueAsNumber: true })}
                error={!!errors.goalValue}
                helperText={errors.goalValue?.message}
              />
              {comparator === 'BETWEEN' ? (
                <TextField
                  label="Upper bound"
                  type="number"
                  size="small"
                  fullWidth
                  {...register('goalMax', { valueAsNumber: true })}
                  error={!!errors.goalMax}
                  helperText={errors.goalMax?.message}
                />
              ) : null}
            </Stack>
            <Stack direction="row" gap={2}>
              <Controller
                control={control}
                name="format"
                render={({ field }) => (
                  <TextField select label="Format" size="small" fullWidth {...field}>
                    {FORMATS.map((f) => (
                      <MenuItem key={f.value} value={f.value}>
                        {f.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField label="Unit (optional)" size="small" fullWidth {...register('unit')} />
            </Stack>
            <Stack direction="row" gap={1} justifyContent="flex-end">
              {editingId ? (
                <Button onClick={cancelEdit} disabled={isSubmitting}>
                  Cancel edit
                </Button>
              ) : null}
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {editingId ? 'Save changes' : 'Add measurable'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
