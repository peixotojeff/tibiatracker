// src/app/api/test-character/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, world, vocation } = await request.json();

    if (!name || !world || !vocation) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Normaliza o mundo para o formato da API (ex: "Calmera" → "calmera")
    const worldSlug = world.trim().toLowerCase();
    const nameNormalized = name.trim();

    // Procura nas páginas 1 a 20
    for (let page = 1; page <= 20; page++) {
      const url = `https://api.tibiadata.com/v4/highscores/${worldSlug}/experience/${vocation}/${page}`;

      try {
        const res = await fetch(url, { timeout: 5000 });
        if (!res.ok) continue;

        const data = await res.json();
        const list = data.highscores?.highscore_list || [];

        const found = list.find(
          (entry: any) => entry.name.toLowerCase() === nameNormalized.toLowerCase()
        );

        if (found) {
          return Response.json({
            success: true,
            level: found.level,
            xp: found.value,
            page,
          });
        }
      } catch (err) {
        console.error(`Error on page ${page}:`, err);
        continue;
      }
    }

    return Response.json({ success: false, message: 'Character not found in pages 1-20' });
  } catch (error) {
    console.error('Test character error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}