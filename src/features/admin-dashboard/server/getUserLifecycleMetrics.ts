import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { UserLifecycleMetricsResult } from '../types/userLifecycle';

const AUTH_EMAIL_LOOKUP_CHUNK = 20;

async function fetchAuthEmailsForUserIds(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userIds: string[]
): Promise<string[]> {
  const emails: string[] = [];
  for (let i = 0; i < userIds.length; i += AUTH_EMAIL_LOOKUP_CHUNK) {
    const chunk = userIds.slice(i, i + AUTH_EMAIL_LOOKUP_CHUNK);
    const chunkResults = await Promise.all(
      chunk.map(async userId => {
        try {
          const {
            data: { user },
          } = await supabase.auth.admin.getUserById(userId);
          const email = user?.email?.trim();
          return email && email.length > 0 ? email : null;
        } catch {
          return null;
        }
      })
    );
    for (const e of chunkResults) {
      if (e) emails.push(e);
    }
  }
  return [...new Set(emails)].sort((a, b) => a.localeCompare(b));
}

function toIsoDateStart(daysAgo: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString();
}

export async function getUserLifecycleMetrics(): Promise<UserLifecycleMetricsResult> {
  const generatedAtIso = new Date().toISOString();
  const todayStartIso = toIsoDateStart(0);
  const sevenDaysAgoIso = toIsoDateStart(6);
  const thirtyDaysAgoIso = toIsoDateStart(29);
  const sevenDaysAgoDate = sevenDaysAgoIso.slice(0, 10);
  const thirtyDaysAgoDate = thirtyDaysAgoIso.slice(0, 10);

  try {
    const supabase = createSupabaseAdminClient();

    const [
      signupsTodayResult,
      signups7dResult,
      signups30dResult,
      totalUsersResult,
      onboardingCompletedResult,
      totalBookingsResult,
      bookings7dResult,
      bookings30dResult,
      usageRowsResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', todayStartIso),
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgoIso),
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgoIso),
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true }),
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .eq('onboarding_status', 'completed'),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_date', sevenDaysAgoDate),
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_date', thirtyDaysAgoDate),
      supabase.from('business_profiles').select(
        `
          profile_id,
          business_slug,
          services:business_services(count),
          images:business_images(count)
        `
      ),
    ]);

    const warning =
      signupsTodayResult.error?.message ||
      signups7dResult.error?.message ||
      signups30dResult.error?.message ||
      totalUsersResult.error?.message ||
      onboardingCompletedResult.error?.message ||
      totalBookingsResult.error?.message ||
      bookings7dResult.error?.message ||
      bookings30dResult.error?.message ||
      usageRowsResult.error?.message ||
      null;

    type UsageRow = {
      profile_id: string;
      business_slug: string | null;
      services: Array<{ count: number }> | null;
      images: Array<{ count: number }> | null;
    };
    const usageRows = (usageRowsResult.data ?? []) as UsageRow[];

    const usersWithCreatedService = usageRows.filter(
      row => (row.services?.[0]?.count ?? 0) > 0
    ).length;
    const usersWithUploadedImage = usageRows.filter(
      row => (row.images?.[0]?.count ?? 0) > 0
    ).length;
    const usersWithLink = usageRows.filter(
      row => !!row.business_slug && row.business_slug.trim().length > 0
    ).length;
    const mainWorkflowRows = usageRows.filter(row => {
      const serviceCount = row.services?.[0]?.count ?? 0;
      const imageCount = row.images?.[0]?.count ?? 0;
      const hasLink = !!row.business_slug && row.business_slug.trim().length > 0;
      return serviceCount > 0 && imageCount > 0 && hasLink;
    });
    const usersCompletedMainWorkflow = mainWorkflowRows.length;
    const mainWorkflowProfileIds = [
      ...new Set(mainWorkflowRows.map(row => row.profile_id).filter(Boolean)),
    ];
    const mainWorkflowCompletedUserEmails =
      mainWorkflowProfileIds.length > 0
        ? await fetchAuthEmailsForUserIds(supabase, mainWorkflowProfileIds)
        : [];

    const totalUsers = totalUsersResult.count ?? 0;
    const onboardingCompletedUsers = onboardingCompletedResult.count ?? 0;
    const onboardingCompletionRate =
      totalUsers > 0
        ? Math.round((onboardingCompletedUsers / totalUsers) * 100)
        : 0;
    const topFeatures = [
      { feature: 'Onboarding Completed', users: onboardingCompletedUsers },
      { feature: 'Created a Service', users: usersWithCreatedService },
      { feature: 'Uploaded an Image', users: usersWithUploadedImage },
      { feature: 'Created Public Link', users: usersWithLink },
      { feature: 'Completed Main Workflow', users: usersCompletedMainWorkflow },
    ].sort((a, b) => b.users - a.users);

    return {
      metrics: {
        signupsToday: signupsTodayResult.count ?? 0,
        signupsLast7Days: signups7dResult.count ?? 0,
        signupsLast30Days: signups30dResult.count ?? 0,
        onboardingCompletedUsers,
        totalUsers,
        onboardingCompletionRate,
        totalBookings: totalBookingsResult.count ?? 0,
        bookingsLast7Days: bookings7dResult.count ?? 0,
        bookingsLast30Days: bookings30dResult.count ?? 0,
        generatedAtIso,
        usersWithCreatedService,
        usersWithUploadedImage,
        usersCompletedMainWorkflow,
        mainWorkflowCompletedUserEmails,
        topFeatures,
      },
      warning,
    };
  } catch (error) {
    return {
      metrics: {
        signupsToday: 0,
        signupsLast7Days: 0,
        signupsLast30Days: 0,
        onboardingCompletedUsers: 0,
        totalUsers: 0,
        onboardingCompletionRate: 0,
        totalBookings: 0,
        bookingsLast7Days: 0,
        bookingsLast30Days: 0,
        generatedAtIso,
        usersWithCreatedService: 0,
        usersWithUploadedImage: 0,
        usersCompletedMainWorkflow: 0,
        mainWorkflowCompletedUserEmails: [],
        topFeatures: [],
      },
      warning:
        error instanceof Error ? error.message : 'Unable to load lifecycle data',
    };
  }
}
