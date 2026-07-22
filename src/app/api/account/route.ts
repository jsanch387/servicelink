import { handleDeleteAccountRequest } from '@/features/account/server/deleteAccountRouteHandler';
import { handleUpdateAccountEmailRequest } from '@/features/account/server/updateAccountEmailRouteHandler';
import { NextRequest } from 'next/server';

export async function DELETE(request: NextRequest) {
  return handleDeleteAccountRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleUpdateAccountEmailRequest(request);
}
