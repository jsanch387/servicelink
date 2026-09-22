import type { TeamInviteStatus } from '../constants/teamInvite';

export interface TeamInviteRow {
  id: string;
  business_id: string;
  email: string;
  link_token_hash: string;
  status: TeamInviteStatus;
  invited_by: string;
  accepted_user_id: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}
