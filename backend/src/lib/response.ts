import { NextResponse } from 'next/server';

export function success<T>(data: T, message = 'OK', meta?: any) {
  const body: any = { success: true, data, message };
  if (meta) body.meta = meta;
  return NextResponse.json(body);
}

export function error(code: string, message: string, status = 400, details?: any) {
  return NextResponse.json(
    { success: false, error: { code, message, details } },
    { status }
  );
}

export function paginated<T>(data: T[], page: number, limit: number, total: number) {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
