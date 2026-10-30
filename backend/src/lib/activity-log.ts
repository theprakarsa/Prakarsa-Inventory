import { prisma } from './prisma';
import { NextRequest } from 'next/server';

interface LogParams {
  userId?: number;
  action: string;
  module: string;
  referenceId?: number;
  description?: string;
  req?: NextRequest;
}

export async function logActivity(params: LogParams): Promise<void> {
  try {
    const ip =
      params.req?.headers.get('x-forwarded-for') ??
      params.req?.headers.get('x-real-ip') ??
      'unknown';
    const ua = params.req?.headers.get('user-agent') ?? 'unknown';

    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        module: params.module,
        referenceId: params.referenceId,
        description: params.description ?? '',
        ipAddress: ip,
        userAgent: ua,
      },
    });
  } catch (e) {
    console.error('[activity-log] gagal:', e);
  }
}
