'use client';

import { Button } from '@/components/shared';
import { useSignOutAndRedirect } from '@/features/auth';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';
import React from 'react';

export const SettingsLogoutButton: React.FC = () => {
  const { signOutAndRedirect, loading } = useSignOutAndRedirect();

  return (
    <Button
      type="button"
      variant="secondary"
      fullWidth
      onClick={() => void signOutAndRedirect()}
      disabled={loading}
      icon={<ArrowRightStartOnRectangleIcon className="h-3.5 w-3.5" />}
    >
      {loading ? 'Logging out…' : 'Log out'}
    </Button>
  );
};
