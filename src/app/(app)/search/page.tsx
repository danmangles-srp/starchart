import { requireUser } from '@/lib/auth/requireUser';
import { searchReadable } from '@/features/search/data/searchRepo';
import SearchView from '@/features/search/components/SearchView';

/** Global cross-module search over the viewer's readable teams (FR-8.1). */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const viewer = await requireUser();
  const query = q ?? '';
  const results = await searchReadable(viewer, query);
  return <SearchView query={query} results={results} />;
}
