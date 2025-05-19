import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or key');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const INTERNAL_SERVER_ERROR = 'Internal server error';

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, moduleId, progress } = await request.json();

    if (!userId || !courseId || !moduleId || typeof progress !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid parameters' },
        { status: 400 },
      );
    }

    const { error } = await supabase.from('module_progress').upsert([
      {
        user_id: userId,
        course_id: courseId,
        module_id: moduleId,
        progress: progress,
      },
    ]);

    if (error) {
      console.error('Error updating module progress:', error);
      return NextResponse.json(
        { error: 'Error updating module progress' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: 'Module progress updated successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating module progress:', error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const moduleId = searchParams.get('moduleId');

    if (!userId || !courseId || !moduleId) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('module_progress')
      .select('progress')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .single();

    if (error) {
      console.error('Error fetching module progress:', error);
      return NextResponse.json(
        { error: 'Error fetching module progress' },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ progress: 0 }, { status: 200 }); // Return 0 if no progress found
    }

    return NextResponse.json({ progress: data.progress }, { status: 200 });
  } catch (error) {
    console.error('Error fetching module progress:', error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}
