import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';
import { moduleProgressSchema } from '@/lib/validation/schemas';
import { ZodError } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or key');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = moduleProgressSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => err.message)
        .join(', ');
      return NextResponse.json(
        createErrorResponse(
          `Invalid input: ${errorMessages}`,
          'VALIDATION_ERROR',
        ),
        { status: 400 },
      );
    }

    const { userId, courseId, moduleId, progress } = validationResult.data;

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
        createErrorResponse('Error updating module progress', 'DATABASE_ERROR'),
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: 'Module progress updated successfully' },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${error.errors.map((err) => err.message).join(', ')}`,
          'VALIDATION_ERROR',
        ),
        { status: 400 },
      );
    }
    console.error('Error updating module progress:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      userId: searchParams.get('userId'),
      courseId: searchParams.get('courseId'),
      moduleId: searchParams.get('moduleId'),
    };

    const validationResult = moduleProgressSchema
      .partial()
      .safeParse(queryParams);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => err.message)
        .join(', ');
      return NextResponse.json(
        createErrorResponse(
          `Invalid query parameters: ${errorMessages}`,
          'VALIDATION_ERROR',
        ),
        { status: 400 },
      );
    }

    const { userId, courseId, moduleId } = validationResult.data;

    if (!userId || !courseId || !moduleId) {
      return NextResponse.json(
        createErrorResponse(
          'Missing required query parameters (userId, courseId, moduleId)',
          'VALIDATION_ERROR',
        ),
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
        createErrorResponse('Error fetching module progress', 'DATABASE_ERROR'),
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ progress: 0 }, { status: 200 }); // Return 0 if no progress found
    }

    return NextResponse.json({ progress: data.progress }, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        createErrorResponse(
          `Validation error: ${error.errors.map((err) => err.message).join(', ')}`,
          'VALIDATION_ERROR',
        ),
        { status: 400 },
      );
    }
    console.error('Error fetching module progress:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
