// src/app/api/characters/[id]/logs/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Verifica se o usuário está logado
  const {  { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verifica se o personagem pertence ao usuário
  const {  char, error: charError } = await supabase
    .from('characters')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (charError || !char) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  // Busca os logs ordenados por data
  const {  logs, error: logsError } = await supabase
    .from('xp_logs')
    .select('id, character_id, date, level, xp')
    .eq('character_id', id)
    .order('date', { ascending: true });

  if (logsError) {
    console.error('Erro ao buscar logs:', logsError);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }

  return NextResponse.json({ logs });
}