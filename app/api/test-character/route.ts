// src/app/api/test-character/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, world, vocation } = await request.json();

    if (!name || !world || !vocation) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const vocationSlug = vocation.toLowerCase();
    const worldSlug = world.trim().toLowerCase();
    const nameNormalized = name.trim();

    for (let page = 1; page <= 20; page++) {
      const url = `https://dev.tibiadata.com/v4/highscores/${worldSlug}/experience/${vocationSlug}/${page}`;

      try {
        // ✅ CORREÇÃO: usa AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.status === 404) {
          console.log(`Page ${page} not found, stopping.`);
          break;
        }

        if (!res.ok) {
          console.warn(`Page ${page} returned ${res.status}`);
          continue;
        }

        const data = await res.json();
        const list = data.highscores?.highscore_list || [];

        if (!Array.isArray(list)) {
          console.warn(`Page ${page}: invalid format`);
          continue;
        }

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
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.error(`Timeout on page ${page}`);
        } else {
          console.error(`Error on page ${page}:`, err.message);
        }
        continue;
      }
    }

    return Response.json({ 
      success: false, 
      message: 'Character not found in pages 1-20.' 
    });
  } catch (error: any) {
    console.error('Test character error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}