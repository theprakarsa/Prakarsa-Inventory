import { NextRequest } from 'next/server';
import { requireAuth } from '@/middlewares/auth';
import { success, error } from '@/lib/response';
import { saveUpload } from '@/lib/upload';

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const subdir = (formData.get('subdir') as string) || 'misc';

  if (!file) return error('NO_FILE', 'File tidak ditemukan', 400);

  try {
    const uploaded = await saveUpload(file, subdir);
    return success(uploaded, 'File terupload');
  } catch (e: any) {
    return error('UPLOAD_FAILED', e.message || 'Gagal upload', 400);
  }
}
