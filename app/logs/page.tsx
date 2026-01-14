// src/app/logs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { XPLog } from '@/types';

export default function LogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<XPLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redireciona se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Carrega os logs do usuário
  useEffect(() => {
    if (user) {
      const fetchLogs = async () => {
        try {
          setLoading(true);
          setError(null);

          const { data, error: fetchError } = await supabase
            .from('xp_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

          if (fetchError) {
            console.error('Erro ao buscar logs:', fetchError);
            setError('Não foi possível carregar seus logs.');
          } else {
            setLogs(data || []);
          }
        } catch (err) {
          console.error(err);
          setError('Ocorreu um erro inesperado.');
        } finally {
          setLoading(false);
        }
      };

      fetchLogs();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <p>Carregando seus logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-500 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Meus Logs de XP</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-sm text-red-500 hover:underline"
        >
          Sair
        </button>
      </div>

      {logs.length === 0 ? (
        <p className="text-gray-500">Nenhum log registrado ainda.</p>
      ) : (
        <ul className="space-y-3">
          {logs.map((log) => (
            <li
              key={log.id}
              className="border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="font-medium">{log.character_name}</div>
              <div className="text-gray-600">
                {log.xp.toLocaleString('pt-BR')} XP em {log.date}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <a
          href="/"
          className="text-blue-500 hover:underline"
        >
          ← Voltar ao dashboard
        </a>
      </div>
    </div>
  );
}