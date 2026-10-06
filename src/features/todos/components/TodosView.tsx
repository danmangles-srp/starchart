'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDays, format, parseISO } from 'date-fns';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EmptyState from '@/components/states/EmptyState';
import { overdueLabel, type TodoRow } from '../domain/todo';
import {
  createTodoAction,
  deleteTodoAction,
  setTodoDoneAction,
  updateTodoAction,
} from '../server/actions';

const FormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  ownerId: z.string().min(1, 'Choose an owner'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date'),
  notes: z.string().trim().max(2000).optional(),
});
type FormValues = z.infer<typeof FormSchema>;

function dateInput(iso: string): string {
  return format(parseISO(iso), 'yyyy-MM-dd');
}
function dueLabel(iso: string): string {
  return format(parseISO(iso), 'MMM d, yyyy');
}

export default function TodosView({
  teamId,
  todos,
  members,
  canEdit,
}: {
  teamId: string;
  todos: TodoRow[];
  members: { userId: string; name: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TodoRow | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Local copy for optimistic done-toggles (INV-5), re-seeded from the server
  // after each refresh via a render-time resync (not an effect).
  const [items, setItems] = useState(todos);
  const [prevTodos, setPrevTodos] = useState(todos);
  if (todos !== prevTodos) {
    setPrevTodos(todos);
    setItems(todos);
  }

  const open = useMemo(() => items.filter((t) => !t.done), [items]);
  const done = useMemo(() => items.filter((t) => t.done), [items]);

  function toggleDone(todo: TodoRow, next: boolean) {
    setError(null);
    const previous = items;
    setItems((cur) =>
      cur.map((t) =>
        t.id === todo.id
          ? { ...t, done: next, completedAt: next ? new Date().toISOString() : null }
          : t,
      ),
    );
    void (async () => {
      const res = await setTodoDoneAction({ todoId: todo.id, done: next });
      if (!res.ok) {
        setItems(previous); // rollback
        setError(res.message ?? 'Could not update the todo.');
        return;
      }
      router.refresh();
    })();
  }

  const defaults = useMemo<FormValues>(
    () => ({
      title: '',
      ownerId: members[0]?.userId ?? '',
      dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      notes: '',
    }),
    [members],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: defaults });

  function openAdd() {
    setEditing(null);
    reset(defaults);
    setDialogOpen(true);
  }
  function openEdit(todo: TodoRow) {
    setEditing(todo);
    reset({
      title: todo.title,
      ownerId: todo.ownerId,
      dueDate: dateInput(todo.dueDate),
      notes: todo.notes ?? '',
    });
    setDialogOpen(true);
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const payload = { ...values, notes: values.notes?.trim() ? values.notes.trim() : null };
    const res = editing
      ? await updateTodoAction({ todoId: editing.id, ...payload })
      : await createTodoAction({ teamId, ...payload });
    if (!res.ok) {
      setError(res.message ?? 'Could not save the todo.');
      return;
    }
    setDialogOpen(false);
    router.refresh();
  });

  async function remove(id: string) {
    setError(null);
    const res = await deleteTodoAction({ todoId: id });
    if (!res.ok) {
      setError(res.message ?? 'Could not delete the todo.');
      return;
    }
    setConfirmId(null);
    router.refresh();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1">
          Todos
        </Typography>
        {canEdit ? (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            Add todo
          </Button>
        ) : null}
      </Stack>

      {items.length === 0 ? (
        <EmptyState
          title="No todos yet"
          description="7-day action items for this team will appear here."
          action={
            canEdit ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
                Add the first todo
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Stack gap={3}>
          <TodoSection
            heading={`Open (${open.length})`}
            todos={open}
            canEdit={canEdit}
            onToggle={toggleDone}
            onEdit={openEdit}
            onDelete={setConfirmId}
            confirmId={confirmId}
            onConfirmDelete={remove}
            onCancelDelete={() => setConfirmId(null)}
          />
          {done.length > 0 ? (
            <TodoSection
              heading={`Done (${done.length})`}
              todos={done}
              canEdit={canEdit}
              onToggle={toggleDone}
              onEdit={openEdit}
              onDelete={setConfirmId}
              confirmId={confirmId}
              onConfirmDelete={remove}
              onCancelDelete={() => setConfirmId(null)}
            />
          ) : null}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit todo' : 'Add todo'}</DialogTitle>
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
              <TextField
                label="Due date"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                {...register('dueDate')}
                error={!!errors.dueDate}
                helperText={errors.dueDate?.message}
              />
              <TextField
                label="Notes (optional)"
                size="small"
                fullWidth
                multiline
                {...register('notes')}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {editing ? 'Save' : 'Add'}
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

function TodoSection({
  heading,
  todos,
  canEdit,
  onToggle,
  onEdit,
  onDelete,
  confirmId,
  onConfirmDelete,
  onCancelDelete,
}: {
  heading: string;
  todos: TodoRow[];
  canEdit: boolean;
  onToggle: (t: TodoRow, next: boolean) => void;
  onEdit: (t: TodoRow) => void;
  onDelete: (id: string) => void;
  confirmId: string | null;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}) {
  const now = new Date();
  return (
    <Box component="section" aria-label={heading}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        {heading}
      </Typography>
      <Stack gap={1}>
        {todos.map((t) => {
          const overdue = overdueLabel(parseISO(t.dueDate), t.done, now);
          return (
            <Paper key={t.id} variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" alignItems="flex-start" gap={1}>
                <Checkbox
                  checked={t.done}
                  disabled={!canEdit}
                  onChange={(e) => onToggle(t, e.target.checked)}
                  inputProps={{ 'aria-label': `Mark ${t.title} ${t.done ? 'not done' : 'done'}` }}
                  sx={{ mt: -0.5 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{ textDecoration: t.done ? 'line-through' : 'none' }}
                  >
                    {t.title}
                  </Typography>
                  <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="caption" color="text.secondary">
                      {t.ownerName} · due {dueLabel(t.dueDate)}
                    </Typography>
                    {overdue ? (
                      <Chip
                        size="small"
                        color="error"
                        variant="outlined"
                        icon={<WarningAmberIcon fontSize="small" />}
                        label={overdue}
                      />
                    ) : null}
                  </Stack>
                  {t.notes ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {t.notes}
                    </Typography>
                  ) : null}
                </Box>
                {canEdit ? (
                  confirmId === t.id ? (
                    <Stack direction="row" gap={0.5}>
                      <Button size="small" color="error" onClick={() => onConfirmDelete(t.id)}>
                        Delete
                      </Button>
                      <Button size="small" onClick={onCancelDelete}>
                        Cancel
                      </Button>
                    </Stack>
                  ) : (
                    <Stack direction="row">
                      <IconButton
                        size="small"
                        aria-label={`Edit ${t.title}`}
                        onClick={() => onEdit(t)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label={`Delete ${t.title}`}
                        onClick={() => onDelete(t.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )
                ) : null}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
