// Alias of /api/saved-trips/[id] — the frontend specs reference /api/trips/{id}.
import { handleDelete } from '@/lib/api/saved-trips'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  return handleDelete(req, params.id)
}
