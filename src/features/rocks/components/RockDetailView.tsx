'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import StatusChip from '@/components/StatusChip';
import { milestoneProgress, type RockDetail } from '../domain/rock';
import {
  addMilestoneAction,
  toggleMilestoneAction,
  reorderMilestonesAction,
} from '../server/actions';

type Milestone = RockDetail['milestones'][number];

function SortableMilestone({
  milestone,
  canEdit,
  onToggle,
}: {
  milestone: Milestone;
  canEdit: boolean;
  onToggle: (id: string, done: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: milestone.id,
  });
  return (
    <Stack
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      direction="row"
      alignItems="center"
      gap={0.5}
    >
      {canEdit ? (
        <IconButton
          size="small"
          aria-label={`Reorder ${milestone.title}`}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      ) : null}
      <Checkbox
        checked={milestone.done}
        disabled={!canEdit}
        onChange={(e) => onToggle(milestone.id, e.target.checked)}
        inputProps={{ 'aria-label': `Milestone ${milestone.title}` }}
      />
      <Typography sx={{ textDecoration: milestone.done ? 'line-through' : 'none' }}>
        {milestone.title}
      </Typography>
    </Stack>
  );
}

export default function RockDetailView({ rock, canEdit }: { rock: RockDetail; canEdit: boolean }) {
  const router = useRouter();
  const [milestones, setMilestones] = useState(rock.milestones);
  const [prevSource, setPrevSource] = useState(rock.milestones);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Re-seed from the server after a refresh (render-time resync, not an effect).
  if (rock.milestones !== prevSource) {
    setPrevSource(rock.milestones);
    setMilestones(rock.milestones);
  }
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const doneCount = milestones.filter((m) => m.done).length;

  const toggle = (milestoneId: string, next: boolean) => {
    const previous = milestones;
    setError(null);
    setMilestones((cur) => cur.map((m) => (m.id === milestoneId ? { ...m, done: next } : m)));
    startTransition(async () => {
      const result = await toggleMilestoneAction({ rockId: rock.id, milestoneId, done: next });
      if (!result.ok) {
        setMilestones(previous);
        setError(result.message);
      }
    });
  };

  const add = () => {
    const value = title.trim();
    if (!value) return;
    setTitle('');
    setError(null);
    const previous = milestones;
    const optimistic: Milestone = {
      id: `temp-${Date.now()}`,
      title: value,
      dueDate: null,
      done: false,
      order: milestones.length + 1,
    };
    setMilestones((cur) => [...cur, optimistic]);
    startTransition(async () => {
      const result = await addMilestoneAction({ rockId: rock.id, title: value });
      if (!result.ok) {
        setMilestones(previous);
        setError(result.message);
      } else {
        router.refresh();
      }
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const previous = milestones;
    const oldIndex = milestones.findIndex((m) => m.id === active.id);
    const newIndex = milestones.findIndex((m) => m.id === over.id);
    const next = arrayMove(milestones, oldIndex, newIndex);
    setMilestones(next);
    setError(null);
    startTransition(async () => {
      const result = await reorderMilestonesAction({
        rockId: rock.id,
        orderedIds: next.map((m) => m.id),
      });
      if (!result.ok) {
        setMilestones(previous);
        setError(result.message);
      }
    });
  };

  return (
    <Box sx={{ maxWidth: 680 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        gap={1}
        sx={{ mb: 1 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1">
            {rock.title}
          </Typography>
          <Typography color="text.secondary">
            {rock.ownerName} · {rock.level.toLowerCase()}
          </Typography>
        </Box>
        <StatusChip status={rock.status} />
      </Stack>
      {rock.description ? <Typography sx={{ mb: 2 }}>{rock.description}</Typography> : null}

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Milestones {milestoneProgress(doneCount, milestones.length)}
      </Typography>
      {error ? (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      ) : null}

      {milestones.length === 0 ? (
        <Typography color="text.secondary">No milestones yet.</Typography>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={milestones.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={0.5}>
              {milestones.map((m) => (
                <SortableMilestone key={m.id} milestone={m} canEdit={canEdit} onToggle={toggle} />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}

      {canEdit ? (
        <Stack
          direction="row"
          gap={1}
          sx={{ mt: 2 }}
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <TextField
            size="small"
            label="New milestone"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <Button type="submit" variant="outlined" disabled={!title.trim()}>
            Add
          </Button>
        </Stack>
      ) : null}
    </Box>
  );
}
