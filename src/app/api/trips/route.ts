// Alias of /api/saved-trips — the frontend specs reference /api/trips.
import { handleList, handleSave } from '@/lib/api/saved-trips'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  return handleList(req)
}

export async function POST(req: Request) {
  return handleSave(req)
}
