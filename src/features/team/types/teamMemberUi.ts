export const TEAM_MEMBER_UI_STATUSES = ['invited', 'active'] as const;
export type TeamMemberUiStatus = (typeof TEAM_MEMBER_UI_STATUSES)[number];

export const TEAM_MEMBER_UI_SOURCES = ['invite', 'member'] as const;
export type TeamMemberUiSource = (typeof TEAM_MEMBER_UI_SOURCES)[number];

/** Row in the Team members list (pending invite or active member). */
export interface TeamMemberUi {
  id: string;
  email: string;
  status: TeamMemberUiStatus;
  source: TeamMemberUiSource;
}
