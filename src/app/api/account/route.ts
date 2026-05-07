import { handleDeleteAccountRequest } from '@/features/account/server/deleteAccountRouteHandler';
import { NextRequest } from 'next/server';

export async function DELETE(request: NextRequest) {
  return handleDeleteAccountRequest(request);
}
