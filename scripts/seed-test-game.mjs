#!/usr/bin/env node
/**
 * Creates a host session with 15 teams and fills answers for every game,
 * then advances to heights → results so charts are immediately visible.
 *
 * Usage:
 *   node scripts/seed-test-game.mjs
 *   BASE_URL=http://localhost:4201 PASSWORD=Roche26 TEAMS=15 node scripts/seed-test-game.mjs
 */

const BASE_URL = (process.env.BASE_URL || 'http://localhost:4200').replace(/\/$/, '');
const PASSWORD = process.env.PASSWORD || 'Roche26';
const TEAM_COUNT = Math.min(30, Math.max(1, Number(process.env.TEAMS) || 15));
const ADVANCE_TO = process.env.ADVANCE_TO || 'heights-results'; // lobby | heights-results | done

const TEAM_NAMES = [
  'Actemra',
  'Alecensa',
  'Avastin',
  'CellCept',
  'Columvi',
  'Cotellic',
  'Enspryng',
  'Erivedge',
  'Esbriet',
  'Evrysdi',
  'Fuzeon',
  'Gazyva',
  'Hemlibra',
  'Herceptin',
  'MabThera',
];

const PARENT_NAMES = [
  'Alex',
  'Sam',
  'Chris',
  'Jordan',
  'Taylor',
  'Morgan',
  'Casey',
  'Riley',
  'Quinn',
  'Avery',
  'Jamie',
  'Cameron',
  'Drew',
  'Reese',
  'Skyler',
];

const CHILD_NAMES = [
  'Lina',
  'Noah',
  'Mia',
  'Leo',
  'Emma',
  'Luca',
  'Sofia',
  'Ben',
  'Nina',
  'Jonas',
  'Lara',
  'Finn',
  'Ella',
  'Tim',
  'Sara',
];

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${data?.message || text}`);
  }
  return data;
}

function rand(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

async function advance(code, hostKey, times) {
  for (let i = 0; i < times; i += 1) {
    await api('PATCH', `/sessions/${code}`, { hostKey, action: 'next' });
  }
}

async function main() {
  console.log(`Base: ${BASE_URL}`);
  const health = await fetch(`${BASE_URL}/health`).catch(() => null);
  if (!health?.ok) {
    const alt = await fetch(`${BASE_URL}/api/health`).catch(() => null);
    if (!alt?.ok) {
      throw new Error(`App nicht erreichbar unter ${BASE_URL}`);
    }
  }

  const session = await api('POST', '/sessions', {
    password: PASSWORD,
    umfangTruth: 28,
    studyDrugColor: 'black',
  });
  const { code, hostKey } = session;
  console.log(`Session ${code} erstellt`);

  const teams = [];
  for (let i = 0; i < TEAM_COUNT; i += 1) {
    const name = TEAM_NAMES[i] || `Team ${i + 1}`;
    const joined = await api('POST', `/sessions/${code}/join`, {
      teamName: name,
      people: [
        { role: 'parent', name: PARENT_NAMES[i % PARENT_NAMES.length] },
        { role: 'child', name: CHILD_NAMES[i % CHILD_NAMES.length] },
      ],
    });
    teams.push(joined.team);
  }
  console.log(`${teams.length} Teams beigetreten`);

  const memoryRounds = session.memoryRounds?.length || 5;
  const choices = ['A', 'B', 'C', 'D'];

  for (let i = 0; i < teams.length; i += 1) {
    const team = teams[i];
    const parent = team.people.find((p) => p.role === 'parent');
    const child = team.people.find((p) => p.role === 'child');
    if (!parent || !child) continue;

    const parentCm = rand(165, 190);
    const childCm = rand(135, Math.min(175, parentCm - 5));

    await api('POST', `/sessions/${code}/heights`, {
      teamId: team.id,
      entries: [
        { personId: parent.id, cm: parentCm },
        { personId: child.id, cm: childCm },
      ],
    });

    const parentMeters = rand(20, 40);
    const childMeters = rand(15, 45);
    await api('POST', `/sessions/${code}/umfang`, {
      teamId: team.id,
      entries: [
        { personId: parent.id, meters: parentMeters },
        { personId: child.id, meters: childMeters },
      ],
    });

    for (let round = 0; round < memoryRounds; round += 1) {
      const correctish = i % 3 !== 0 && Math.random() > 0.35;
      const choice = correctish
        ? session.memoryRounds[round]?.correctLabel || pick(choices)
        : pick(choices);
      await api('POST', `/sessions/${code}/memory`, {
        teamId: team.id,
        round,
        choice,
      });
    }

    const parentColor = i % 2 === 0 ? 'black' : 'red';
    const childColor = i % 2 === 0 ? 'red' : 'black';
    await api('POST', `/sessions/${code}/study`, {
      teamId: team.id,
      entries: [
        {
          personId: parent.id,
          color: parentColor,
          before: rand(3, 7),
          after: rand(4, 9),
        },
        {
          personId: child.id,
          color: childColor,
          before: rand(3, 7),
          after: rand(4, 9),
        },
      ],
    });

    await api('POST', `/sessions/${code}/feedback`, {
      teamId: team.id,
      rating: 1 + (i % 6),
      comment: i % 4 === 0 ? 'Super Tag!' : '',
    });
  }
  console.log('Antworten für alle Spiele eingetragen');

  // lobby → heights(play). One more next → heights(results)
  if (ADVANCE_TO === 'heights-results') {
    await advance(code, hostKey, 2);
  } else if (ADVANCE_TO === 'done') {
    // Approximate: lobby→heights play→results→circ play→results→memory show→play→results×5 rounds→study→feedback→done
    // Safer: keep advancing until game === done
    for (let i = 0; i < 40; i += 1) {
      const host = await api('PATCH', `/sessions/${code}`, { hostKey, action: 'next' });
      if (host.game === 'done') break;
    }
  }

  const host = await api('GET', `/sessions/${code}/host?hostKey=${encodeURIComponent(hostKey)}`);
  console.log('');
  console.log('=== Testspiel bereit ===');
  console.log(`PIN:        ${code}`);
  console.log(`Teams:      ${host.teams.length}`);
  console.log(`Spielstand: ${host.game} / ${host.stage}`);
  console.log(`Host:       ${BASE_URL}/host/${code}?hostKey=${hostKey}`);
  console.log(`Join:       ${BASE_URL}/join/${code}`);
  console.log(`Host-Key:   ${hostKey}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
