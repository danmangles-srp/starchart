import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { describeActivity, type ActivityRow } from '../domain/activity';

/** Read-only activity feed. Empty, content — both designed (INV-7). */
export default function ActivityList({ rows }: { rows: ActivityRow[] }) {
  if (rows.length === 0) {
    return <Typography color="text.secondary">No activity yet.</Typography>;
  }
  return (
    <List dense disablePadding>
      {rows.map((row) => (
        <ListItem key={row.id} disableGutters>
          <ListItemText
            primary={`${row.actorName} ${describeActivity(row.action)}`}
            secondary={new Date(row.createdAt).toLocaleString()}
          />
        </ListItem>
      ))}
    </List>
  );
}
