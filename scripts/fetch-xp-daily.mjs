// scripts/fetch-xp-daily.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ← use a SERVICE ROLE KEY (tem acesso total)
);

// scripts/fetch-xp-daily.mjs

async function fetchXPForCharacter(character) {
  const worldSlug = WORLD_MAP[character.world] || character.world.toLowerCase();
  const url = `https://api.tibiadata.com/v4/highscores/${worldSlug}/experience/${character.vocation}/1`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch ${character.name}: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const list = data.highscores?.highscore_list || [];

    const found = list.find(entry =>
      entry.name.toLowerCase() === character.name.toLowerCase()
    );

    return found
      ? { level: found.level, xp: found.value }
      : null;
  } catch (err) {
    console.error(`Error fetching ${character.name}:`, err.message);
    return null;
  }
}

// ❗ ATUALIZADO: busca nas páginas 1 a 20
async function run() {
  const today = new Date().toISOString().split('T')[0]; // "2026-01-14"

  const { data: characters, error } = await supabase
    .from('characters')
    .select('id, name, world, vocation');

  if (error) throw error;

  for (const char of characters) {
    const {  existing } = await supabase
      .from('xp_logs')
      .select('id')
      .eq('character_id', char.id)
      .eq('date', today)
      .limit(1);

    if (existing.length > 0) {
      console.log(`✅ Already logged for ${char.name} today`);
      continue;
    }

    let stats = null;

    // 🔍 Busca nas páginas 1 a 20
    for (let page = 1; page <= 20; page++) {
      const url = `https://api.tibiadata.com/v4/highscores/${worldSlug}/experience/${char.vocation}/${page}`;
      
      try {
        const res = await fetch(url);
        if (!res.ok) continue;

        const data = await res.json();
        const list = data.highscores?.highscore_list || [];

        const found = list.find(entry =>
          entry.name.toLowerCase() === char.name.toLowerCase()
        );

        if (found) {
          stats = { level: found.level, xp: found.value };
          console.log(`✅ Found ${char.name} on page ${page}`);
          break; // Para ao encontrar
        }
      } catch (err) {
        console.error(`Error on page ${page} for ${char.name}:`, err.message);
        continue;
      }
    }

    if (!stats) {
      console.log(`❌ ${char.name} not found in pages 1-20`);
      continue;
    }

    const { error: insertError } = await supabase
      .from('xp_logs')
      .insert({
        character_id: char.id,
        date: today,
        level: stats.level,
        xp: stats.xp,
      });

    if (insertError) {
      console.error(`Failed to insert for ${char.name}:`, insertError.message);
    } else {
      console.log(`✅ Logged ${char.name}: Lvl ${stats.level}, ${stats.xp} XP`);
    }
  }
}