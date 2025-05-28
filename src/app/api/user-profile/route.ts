import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/models/user';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or key');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      createErrorResponse('Missing email parameter', 'VALIDATION_ERROR'),
      { status: 400 },
    );
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        createErrorResponse('Error fetching user profile', 'DATABASE_ERROR'),
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        createErrorResponse('User profile not found', 'NOT_FOUND'),
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userProfile: UserProfile = await request.json();

    const { error } = await supabase
      .from('user_profiles')
      .insert([userProfile]);

    if (error) {
      console.error('Error creating user profile:', error);
      return NextResponse.json(
        createErrorResponse('Error creating user profile', 'DATABASE_ERROR'),
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: 'User profile created successfully' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating user profile:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userProfile: UserProfile = await request.json();

    const { error } = await supabase
      .from('user_profiles')
      .update(userProfile)
      .eq('id', userProfile.id);

    if (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json(
        createErrorResponse('Error updating user profile', 'DATABASE_ERROR'),
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: 'User profile updated successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
