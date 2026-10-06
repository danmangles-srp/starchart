'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { LineChart } from '@mui/x-charts/LineChart';
import { formatMeasurableValue } from '../domain/scorecard';
import { GOAL_STATUS_META } from './goalStatusMeta';
import type { Trend } from '../domain/trend';
import type { ScorecardRowVM } from '../domain/viewModel';

/**
 * A measurable's 13-week trend: a line chart with its goal line, plus a
 * visually-hidden text alternative (caption + table) carrying the same data for
 * assistive tech (NFR-3.5 — a chart is never the only way to read the numbers).
 */
export default function TrendChart({ row, trend }: { row: ScorecardRowVM; trend: Trend }) {
  function formatValue(v: number | null): string {
    return formatMeasurableValue(v, row.format, row.unit);
  }

  const labels = trend.points.map((p) => p.label);
  const values = trend.points.map((p) => p.value);
  const goalLine = trend.points.map(() => trend.goal);
  // BETWEEN defines a band; draw both bounds so the chart matches the cell status.
  const upperLine =
    trend.comparator === 'BETWEEN' && trend.goalMax !== null
      ? trend.points.map(() => trend.goalMax as number)
      : null;

  const avgText =
    trend.average === null ? 'no entries yet' : `${formatValue(trend.average)} average`;
  const captionText = `Trend for ${row.name}: ${avgText}, ${trend.hitRate}, goal ${row.goalLabel}.`;

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {row.name}
      </Typography>

      {/* The chart is decorative for AT; the table below is the accessible equivalent. */}
      <Box aria-hidden sx={{ width: '100%', overflowX: 'auto' }}>
        <LineChart
          height={260}
          width={480}
          xAxis={[{ scaleType: 'point', data: labels }]}
          series={[
            { data: values, label: row.name, connectNulls: false, showMark: true },
            { data: goalLine, label: upperLine ? 'Lower bound' : 'Goal', showMark: false },
            ...(upperLine ? [{ data: upperLine, label: 'Upper bound', showMark: false }] : []),
          ]}
        />
      </Box>

      <Box
        component="table"
        sx={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        <caption>{captionText}</caption>
        <thead>
          <tr>
            <th scope="col">Week</th>
            <th scope="col">Value</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {trend.points.map((p) => (
            <tr key={p.key}>
              <th scope="row">{p.label}</th>
              <td>{formatValue(p.value)}</td>
              <td>{GOAL_STATUS_META[p.status].label}</td>
            </tr>
          ))}
        </tbody>
      </Box>

      {/* Visible summary for sighted users; aria-hidden so AT hears it once (via the table caption). */}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} aria-hidden>
        {captionText}
      </Typography>
    </Box>
  );
}
