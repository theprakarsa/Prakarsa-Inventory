import { ZodSchema } from 'zod';
import { error } from './response';

export async function validateBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  try {
    const body = await req.json();
    const parsed = schema.parse(body);
    return { ok: true, data: parsed };
  } catch (err: any) {
    if (err?.issues) {
      return {
        ok: false,
        response: error('VALIDATION_ERROR', 'Input tidak valid', 422, err.issues),
      };
    }
    return {
      ok: false,
      response: error('INVALID_JSON', 'Body harus JSON valid', 400),
    };
  }
}
