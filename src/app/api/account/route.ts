import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: 'Zaloguj się ponownie.' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    return NextResponse.json({ error: 'Usuwanie kont jest niedostępne. Administrator musi skonfigurować klucz serwerowy Supabase.' }, { status: 503 });
  }

  try {
    const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
    const auth = createClient(url, anonKey, options);
    // Only a verified bearer token determines the account. Never accept a user ID from the request.
    const { data, error } = await auth.auth.getUser(token);
    if (error || !data.user) {
      return NextResponse.json({ error: 'Sesja wygasła. Zaloguj się ponownie.' }, { status: 401 });
    }

    const admin = createClient(url, serviceKey, options);
    const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
    if (deleteError) {
      return NextResponse.json({ error: 'Nie udało się usunąć konta. Spróbuj ponownie.' }, { status: 500 });
    }
    // Foreign keys ON DELETE CASCADE remove this user's profile and training data.
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Usługa kont jest chwilowo niedostępna.' }, { status: 503 });
  }
}
