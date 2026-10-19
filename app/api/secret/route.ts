import { supabase } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { encryptedText } = await request.json();

  const { data, error } = await supabase
    .from('secrets')
    .insert([{ encrypted_text: encryptedText }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing secret id.' }, { status: 400 });
  }

  // Fetch and burn in one step, so two requests can't both read it
  const { data, error } = await supabase
    .from('secrets')
    .delete()
    .eq('id', id)
    .select('encrypted_text')
    .maybeSingle();

  if (error) {
    console.error('Failed to read secret:', error.message);
    return NextResponse.json({ error: 'Could not read the secret. Please try again.' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Secret not found or already burned.' }, { status: 404 });
  }

  return NextResponse.json({ encryptedText: data.encrypted_text });
}
