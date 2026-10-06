'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TuneIcon from '@mui/icons-material/Tune';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import EmptyState from '@/components/states/EmptyState';
import type { ScorecardRowVM, ScorecardVM } from '../domain/viewModel';
import { applyCellEdit, findChangedWeek, normalizeEntryValue } from '../domain/editing';
import { setWeeklyEntryAction } from '../server/actions';
import GoalCell from './GoalCell';
import ManageMeasurablesDialog from './ManageMeasurablesDialog';

const NAME_COL_WIDTH = 240;
const WEEK_COL_WIDTH = 92;

/**
 * The Scorecard grid (FR-4.2): rows = measurables, columns = the trailing 13 ISO
 * weeks newest-left, current week highlighted. Cells carry color + marker + a11y
 * label via GoalCell. DataGrid gives arrow-key cell navigation out of the box.
 * Inline editing arrives in T3.4.
 */
export default function ScorecardGrid({ vm }: { vm: ScorecardVM }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const manageDialog = vm.canManage ? (
    <ManageMeasurablesDialog
      open={manageOpen}
      onClose={() => setManageOpen(false)}
      teamId={vm.teamId}
      rows={vm.rows}
      members={vm.members}
    />
  ) : null;

  // Optimistic write (INV-5): DataGrid shows the edited row immediately via the
  // row returned here; a server rejection throws, so DataGrid rolls the cell back
  // and onProcessRowUpdateError surfaces why.
  const processRowUpdate = useCallback(
    async (newRow: ScorecardRowVM, oldRow: ScorecardRowVM): Promise<ScorecardRowVM> => {
      const week = findChangedWeek(newRow, oldRow, vm.weeks);
      if (!week) return oldRow;
      const value = newRow.cellsByWeek[week.key]?.value ?? null;
      const res = await setWeeklyEntryAction({
        measurableId: newRow.id,
        isoYear: week.isoYear,
        isoWeek: week.isoWeek,
        value,
      });
      if (!res.ok) throw new Error(res.message ?? 'Could not save that entry.');
      router.refresh();
      return newRow;
    },
    [vm.weeks, router],
  );

  const columns = useMemo<GridColDef<ScorecardRowVM>[]>(() => {
    const measurableCol: GridColDef<ScorecardRowVM> = {
      field: 'name',
      headerName: 'Measurable',
      width: NAME_COL_WIDTH,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Stack sx={{ py: 0.5, lineHeight: 1.3 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {params.row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {params.row.ownerName} · {params.row.goalLabel}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {params.row.summary}
          </Typography>
        </Stack>
      ),
    };

    const weekCols: GridColDef<ScorecardRowVM>[] = vm.weeks.map((week) => ({
      field: week.key,
      headerName: week.label,
      width: WEEK_COL_WIDTH,
      sortable: false,
      disableColumnMenu: true,
      headerAlign: 'center',
      align: 'center',
      type: 'number',
      editable: vm.canEdit,
      headerClassName: week.current ? 'cadence-current-week' : undefined,
      cellClassName: week.current ? 'cadence-current-week' : undefined,
      renderHeader: () => (
        <Typography variant="caption" fontWeight={week.current ? 700 : 500} component="span">
          {week.label}
          {week.current ? ' • now' : ''}
        </Typography>
      ),
      // The number carries the value for editing + a11y; display is via GoalCell.
      valueGetter: (_value, row) => row.cellsByWeek[week.key]?.value ?? null,
      valueSetter: (value, row) =>
        applyCellEdit(row, week.key, normalizeEntryValue(value as unknown)),
      renderCell: (params) => {
        const cell = params.row.cellsByWeek[week.key];
        if (!cell) return null;
        return <GoalCell cell={cell} week={week} />;
      },
    }));

    return [measurableCol, ...weekCols];
  }, [vm.weeks, vm.canEdit]);

  function page(deltaWeeks: number) {
    const next = Math.max(0, vm.offsetWeeks + deltaWeeks);
    router.push(next === 0 ? '?' : `?w=${next}`);
  }

  if (vm.rows.length === 0) {
    return (
      <Box>
        <Header
          offset={vm.offsetWeeks}
          onPage={page}
          hasNewer={vm.hasNewer}
          hasOlder={vm.hasOlder}
          canManage={vm.canManage}
          onManage={() => setManageOpen(true)}
        />
        <EmptyState
          title="No measurables yet"
          description="Measurables you add will track weekly against their goal across the trailing 13 weeks."
          action={
            vm.canManage ? (
              <Button
                variant="contained"
                startIcon={<TuneIcon />}
                onClick={() => setManageOpen(true)}
              >
                Add a measurable
              </Button>
            ) : undefined
          }
        />
        {manageDialog}
      </Box>
    );
  }

  return (
    <Box>
      <Header
        offset={vm.offsetWeeks}
        onPage={page}
        hasNewer={vm.hasNewer}
        hasOlder={vm.hasOlder}
        canManage={vm.canManage}
        onManage={() => setManageOpen(true)}
      />
      <Box
        sx={{
          '& .cadence-current-week': {
            bgcolor: 'action.hover',
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: '-2px',
          },
        }}
      >
        <DataGrid<ScorecardRowVM>
          rows={vm.rows}
          columns={columns}
          getRowId={(r) => r.id}
          getRowHeight={() => 56}
          columnHeaderHeight={44}
          disableRowSelectionOnClick
          hideFooter
          editMode="cell"
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(e: unknown) =>
            setError(e instanceof Error ? e.message : 'Could not save that entry.')
          }
          aria-label="Scorecard measurables by ISO week"
          sx={{ '--DataGrid-overlayHeight': '200px' }}
        />
      </Box>
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
      {manageDialog}
    </Box>
  );
}

function Header({
  offset,
  onPage,
  hasNewer,
  hasOlder,
  canManage,
  onManage,
}: {
  offset: number;
  onPage: (deltaWeeks: number) => void;
  hasNewer: boolean;
  hasOlder: boolean;
  canManage: boolean;
  onManage: () => void;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
    >
      <Box>
        <Typography variant="h5" component="h1">
          Scorecard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {offset === 0
            ? 'Trailing 13 weeks — current week first'
            : `Trailing 13 weeks, ${offset} week${offset === 1 ? '' : 's'} back`}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ChevronLeftIcon />}
          onClick={() => onPage(13)}
          disabled={!hasOlder}
        >
          Older
        </Button>
        <Button
          size="small"
          variant="outlined"
          endIcon={<ChevronRightIcon />}
          onClick={() => onPage(-13)}
          disabled={!hasNewer}
        >
          Newer
        </Button>
        {canManage ? (
          <Button size="small" variant="contained" startIcon={<TuneIcon />} onClick={onManage}>
            Manage
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}
