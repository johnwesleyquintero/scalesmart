import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/models/user';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or key');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const INTERNAL_SERVER_ERROR = 'Internal server error';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Missing email parameter' },
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
        { error: 'Error fetching user profile' },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
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
        { error: 'Error creating user profile' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: 'User profile created successfully' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating user profile:', error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
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
        { error: 'Error updating user profile' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: 'User profile updated successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: INTERNAL_SERVER_ERROR }, { status: 500 });
  }
}
