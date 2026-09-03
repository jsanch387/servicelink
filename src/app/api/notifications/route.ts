/**
 * API Route: Notifications
 *
 * GET  /api/notifications – paginated inbox (`filter=new` unread, `filter=recent` read)
 * PATCH /api/notifications – mark notification(s) as read
 */

import { parseNotificationListParams } from '@/features/notifications/utils/parseNotificationListParams';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const NOTIFICATION_COLUMNS =
  'id, type, reference_type, reference_id, title, body, read, read_at, created_at, metadata, dedupe_key';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { limit, offset, filter } = parseNotificationListParams(
      request.nextUrl.searchParams
    );

    const listQuery = supabase
      .from('notifications')
      .select(NOTIFICATION_COLUMNS)
      .eq('user_id', user.id)
      .eq('read', filter === 'recent')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit);

    const unreadCountQuery = supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    const [listResult, unreadResult] = await Promise.all([
      listQuery,
      unreadCountQuery,
    ]);

    if (listResult.error) {
      console.error('Error fetching notifications:', listResult.error);
      return NextResponse.json(
        { success: false, error: listResult.error.message },
        { status: 500 }
      );
    }

    if (unreadResult.error) {
      console.error('Error counting unread notifications:', unreadResult.error);
      return NextResponse.json(
        { success: false, error: unreadResult.error.message },
        { status: 500 }
      );
    }

    const rows = listResult.data || [];
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json({
      success: true,
      data,
      unreadCount: unreadResult.count ?? 0,
      hasMore,
    });
  } catch (err) {
    console.error('Error in notifications GET:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { notificationId, markAll } = body;

    if (markAll === true) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications read:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (!notificationId || typeof notificationId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'notificationId is required' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking notification read:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in notifications PATCH:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
