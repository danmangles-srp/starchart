'use client';

import { useState, type FormEvent } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import EmptyState from '@/components/states/EmptyState';
import { groupResults, isSearchable, resultHref, type SearchResult } from '../domain/search';

export default function SearchView({ query, results }: { query: string; results: SearchResult[] }) {
  const router = useRouter();
  const [value, setValue] = useState(query);
  const groups = groupResults(results);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        Search
      </Typography>

      {/* Self-sufficient search box so the page works standalone (esp. on phone). */}
      <Box component="form" role="search" onSubmit={submit} sx={{ mb: 3, maxWidth: 480 }}>
        <TextField
          type="search"
          fullWidth
          size="small"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search Rocks, Measurables, Issues, Todos…"
          inputProps={{ 'aria-label': 'Search' }}
        />
      </Box>

      {!isSearchable(query) ? (
        <Typography variant="body2" color="text.secondary">
          Type at least 2 characters to search your teams’ Rocks, Measurables, Issues and Todos.
        </Typography>
      ) : results.length === 0 ? (
        <EmptyState
          title="No matches"
          description={`Nothing matches “${query}” across the teams you can see.`}
        />
      ) : (
        <Stack gap={3}>
          {groups.map((g) => (
            <Box key={g.type} component="section" aria-label={g.label}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {g.label} ({g.results.length})
              </Typography>
              <Stack gap={1}>
                {g.results.map((r) => (
                  <Paper key={`${r.type}-${r.id}`} variant="outlined" sx={{ p: 1.25 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      gap={1}
                    >
                      <Link
                        component={NextLink}
                        href={resultHref(r)}
                        variant="body2"
                        underline="hover"
                        noWrap
                      >
                        {r.title}
                      </Link>
                      <Chip size="small" variant="outlined" label={r.teamName} />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
