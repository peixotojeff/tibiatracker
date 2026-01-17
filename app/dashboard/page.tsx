// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { Character } from '@/types';

interface XPData {
  date: string;
  xp: number;
  level: number;
}

interface CharacterMetrics {
  level_real: number;
  media_recente: number;
  eta_str: string;
  streak_count: number;
  cor_delta: string;
  texto_delta: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteCharacter = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este personagem?')) return;

    try {
      const res = await fetch(`/api/characters/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCharacters(characters.filter(char => char.id !== id));
      } else {
        alert('Erro ao excluir personagem');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir personagem');
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      const fetchCharacters = async () => {
        const res = await fetch('/api/characters');
        if (res.ok) {
          const data = await res.json();
          setCharacters(data);
        }
        setLoading(false);
      };
      fetchCharacters();
    }
  }, [user, authLoading, router]);

  if (loading)
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="h-80 bg-gray-700 rounded"></div>
              <div className="h-80 bg-gray-700 rounded"></div>
              <div className="h-80 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen relative py-8" style={{
      backgroundImage: 'url(/images/bg-dungeon.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/85 via-gray-800/85 to-gray-900/90"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {characters.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-400 mb-4">Nenhum personagem cadastrado.</p>
            <button
              onClick={() => router.push('/characters')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
            >
              Cadastrar seu primeiro personagem
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {characters.map((char) => (
              <CharacterCard key={char.id} character={char} onDelete={handleDeleteCharacter} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CharacterCard({ character, onDelete }: { character: Character; onDelete: (id: string) => void }) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<CharacterMetrics | null>(null);
  const [chartData, setChartData] = useState<XPData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metricsRes = await fetch(`/api/characters/${character.id}/metrics`);
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }

        const logsRes = await fetch(`/api/characters/${character.id}/logs`);
        if (logsRes.ok) {
          const logs = await logsRes.json();
          setChartData(
            logs.logs
              .sort((a: XPData, b: XPData) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
              )
              .slice(-7)
          );
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [character.id]);

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden animate-pulse">
        <div className="p-6">
          <div className="h-6 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Calcular XP diário para o mini gráfico
  const dailyData = [];
  for (let i = 1; i < chartData.length; i++) {
    const prevXP = chartData[i - 1].xp;
    const currentXP = chartData[i].xp;
    const dailyGain = currentXP - prevXP;
    dailyData.push({
      date: new Date(chartData[i].date).toLocaleDateString('pt-BR', { day: '2-digit' }),
      xp: dailyGain > 0 ? dailyGain : 0,
    });
  }

  return (
    <div
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-600 cursor-pointer transition-all hover:shadow-xl hover:shadow-blue-500/20"
      onClick={() => router.push(`/logs?characterId=${character.id}`)}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(character.id);
          }}
          className="absolute top-2 right-2 text-red-300 hover:text-red-100 transition"
          title="Excluir personagem"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold">{character.name}</h2>
        <p className="text-blue-100 text-sm">
          {character.vocation.toUpperCase()} • {character.world}
        </p>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="p-6 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-900/30 border border-blue-700/30 rounded p-3">
              <p className="text-xs text-blue-300">Nível</p>
              <p className="text-2xl font-bold text-blue-400">{metrics.level_real}</p>
            </div>
            <div className="bg-green-900/30 border border-green-700/30 rounded p-3">
              <p className="text-xs text-green-300">XP/Dia (30d)</p>
              <p className="text-lg font-bold text-green-400">
                {Math.round(metrics.media_recente).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Mini Chart */}
          {dailyData.length > 0 && (
            <div className="bg-gray-700/50 border border-gray-600/50 rounded-lg p-3">
              <p className="text-xs text-gray-300 font-medium mb-2">XP Últimos 7 dias</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={dailyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#4b5563"
                    horizontal={false}
                  />
                  <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '10px' }} hide={true} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #4b5563',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(value: number | undefined) => [
                      value ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0',
                      'XP',
                    ]}
                  />
                  <Bar dataKey="xp" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Additional Info */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <div>
              <p className="text-xs text-gray-400">Próximo nível</p>
              <p className="text-lg font-semibold text-gray-200">{metrics.eta_str}</p>
            </div>
            <div className={`text-right`}>
              <p className="text-xs text-gray-400">Status</p>
              <p
                className={`font-semibold text-sm ${
                  metrics.cor_delta === 'success' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {metrics.streak_count}d streak
              </p>
            </div>
          </div>

          {/* View Details Button */}
          <button className="w-full mt-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition">
            Ver Detalhes Completos
          </button>
        </div>
      )}
    </div>
  );
}
