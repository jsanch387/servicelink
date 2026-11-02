import type { TeamMemberRole, TeamMemberStatus } from '../constants/teamRoles';

/** A teammate the owner added. The account owner is not a row. */
export interface BusinessMemberRow {
  id: string;
  business_id: string;
  user_id: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  created_at: string;
  updated_at: string;
}
