// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { Character, XPLog } from '@/types';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newChar, setNewChar] = useState({
    name: '',
    world: 'Calmera',
    vocation: 'druid' as const,
  });

  // Redireciona se não estiver logado
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Carrega personagens do usuário
  useEffect(() => {
    if (user) {
      const fetchCharacters = async () => {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('user_id', user.id)
          .order('name', { ascending: true });

        if (error) {
          console.error('Erro ao carregar personagens:', error);
        } else {
          setCharacters(data || []);
        }
        setLoading(false);
      };

      fetchCharacters();
    }
  }, [user]);

  const handleAddCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('characters').insert({
      user_id: user.id,
      name: newChar.name.trim(),
      world: newChar.world,
      vocation: newChar.vocation,
      category: 'experience',
    });

    if (error) {
      alert('Erro ao adicionar personagem: ' + error.message);
    } else {
      setNewChar({ name: '', world: 'Calmera', vocation: 'druid' });
      setShowForm(false);
      // Recarrega a lista
      const { data } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id);
      setCharacters(data || []);
    }
  };

  if (authLoading || loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tibia Tracker</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-red-500 text-sm"
        >
          Sair
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Meus Personagens</h2>
        {characters.length === 0 ? (
          <p className="text-gray-500">Nenhum personagem cadastrado.</p>
        ) : (
          <ul className="space-y-3">
            {characters.map((char) => (
              <li
                key={char.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/character/${char.id}`)}
              >
                <div className="font-medium">{char.name}</div>
                <div className="text-sm text-gray-600">
                  {char.vocation} • {char.world}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="text-blue-500 underline mb-4"
      >
        {showForm ? 'Cancelar' : 'Adicionar novo personagem'}
      </button>

      {showForm && (
        <form onSubmit={handleAddCharacter} className="bg-gray-50 p-4 rounded-lg">
          <input
            type="text"
            placeholder="Nome do personagem"
            value={newChar.name}
            onChange={(e) => setNewChar({ ...newChar, name: e.target.value })}
            className="w-full p-2 border rounded mb-2"
            required
          />
          <select
            value={newChar.world}
            onChange={(e) => setNewChar({ ...newChar, world: e.target.value })}
            className="w-full p-2 border rounded mb-2"
          >
            <option value="Antica">Antica</option>
            <option value="Calmera">Calmera</option>
            <option value="Secura">Secura</option>
            {/* Adicione outros mundos conforme necessário */}
          </select>
          <select
            value={newChar.vocation}
            onChange={(e) => setNewChar({ ...newChar, vocation: e.target.value as any })}
            className="w-full p-2 border rounded mb-3"
          >
            <option value="druid">Druid</option>
            <option value="knight">Knight</option>
            <option value="paladin">Paladin</option>
            <option value="sorcerer">Sorcerer</option>
          </select>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded"
          >
            Salvar Personagem
          </button>
        </form>
      )}
    </div>
  );
}