import { NextResponse } from 'next/server';
import { db } from '@/lib/db/store';
import { getVercelConfig } from '@/lib/vercel/client';

export async function GET() {
  return NextResponse.json(
    { error: 'Access denied. This configuration endpoint is restricted.' },
    { status: 403 }
  );
}

