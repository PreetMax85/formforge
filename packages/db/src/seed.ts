import { db } from './index';
import { users, forms, fields, responses, responseAnswers } from './schema/index';
import { inArray, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo@formforge.tech',
  name: 'Demo Creator',
  // bcrypt.hashSync('Demo@FormForge2026', 12)
};

const ADMIN_USER = {
  id: '00000000-0000-4000-8000-000000000002',
  email: 'admin@formforge.tech',
  name: 'FormForge Admin',
};

const SAMURAI_FORM = {
  id: '10000000-0000-4000-8000-000000000001',
  slug: 'samurai-oath',
  theme: 'ghost-of-tsushima',
};

const JJK_FORM = {
  id: '10000000-0000-4000-8000-000000000002',
  slug: 'jjk-sorcerer-registration',
  theme: 'jujutsu-kaisen',
};

const AUJLA_FORM = {
  id: '10000000-0000-4000-8000-000000000003',
  slug: 'aujla-vip-backstage',
  theme: 'karan-aujla-concert',
};

const DEMO_FORM_SLUGS = [SAMURAI_FORM.slug, JJK_FORM.slug, AUJLA_FORM.slug];
const DEMO_USER_EMAILS = [DEMO_USER.email, ADMIN_USER.email];

async function seed() {
  console.log('[SEED] Starting idempotent seed...');

  await db.delete(forms).where(inArray(forms.slug, DEMO_FORM_SLUGS));
  await db.delete(users).where(inArray(users.email, DEMO_USER_EMAILS));
  console.log('[SEED] Existing demo records cleared');

  // Users — hash passwords with bcrypt so login works
  await db.insert(users).values([
    { ...DEMO_USER, passwordHash: await bcrypt.hash('Demo@FormForge2026', 12) },
    { ...ADMIN_USER, passwordHash: await bcrypt.hash('Admin@FormForge2026', 12) },
  ]).onConflictDoNothing();
  console.log('[SEED] Users seeded');

  // Forms
  await db.insert(forms).values([
    {
      id: SAMURAI_FORM.id, creatorId: DEMO_USER.id,
      title: 'The Samurai Oath',
      description: 'Which path do you walk — honor or survival?',
      slug: SAMURAI_FORM.slug, status: 'published', visibility: 'public',
      theme: SAMURAI_FORM.theme, responseCount: 0, viewCount: 0,
    },
    {
      id: JJK_FORM.id, creatorId: DEMO_USER.id,
      title: 'Sorcerer Registration',
      description: 'Declare your cursed technique. Sign the binding vow.',
      slug: JJK_FORM.slug, status: 'published', visibility: 'public',
      theme: JJK_FORM.theme, responseCount: 0, viewCount: 0,
    },
    {
      id: AUJLA_FORM.id, creatorId: DEMO_USER.id,
      title: 'VIP Backstage Pass',
      description: 'One night. One stage. Which song hits different?',
      slug: AUJLA_FORM.slug, status: 'published', visibility: 'public',
      theme: AUJLA_FORM.theme, responseCount: 0, viewCount: 0,
    },
  ]).onConflictDoNothing();
  console.log('[SEED] Forms seeded');

  // ── Samurai Oath fields (6) ──────────────────────────────────
  // short_text, single_select x2, rating, long_text, email
  const samuraiFields = [
    { id: 'f1000000-0000-4000-8000-000000000001', formId: SAMURAI_FORM.id, type: 'short_text', label: 'Your warrior name', required: true, order: 1, config: {} },
    { id: 'f1000000-0000-4000-8000-000000000002', formId: SAMURAI_FORM.id, type: 'single_select', label: 'Chosen fighting style', required: true, order: 2, config: { options: ['Way of the Samurai', 'Ghost Tactics', 'Balanced Path', 'The Ronin Way'] } },
    { id: 'f1000000-0000-4000-8000-000000000003', formId: SAMURAI_FORM.id, type: 'single_select', label: 'Which clan do you serve?', required: true, order: 3, config: { options: ['Clan Sakai', 'The Ghost', "Shimura's Army", 'No Clan'] } },
    { id: 'f1000000-0000-4000-8000-000000000004', formId: SAMURAI_FORM.id, type: 'rating', label: 'Rate your sword proficiency', required: true, order: 4, config: { max: 10 } },
    { id: 'f1000000-0000-4000-8000-000000000005', formId: SAMURAI_FORM.id, type: 'long_text', label: 'Describe your greatest battle', required: false, order: 5, config: {} },
    { id: 'f1000000-0000-4000-8000-000000000006', formId: SAMURAI_FORM.id, type: 'email', label: 'Your email', required: false, order: 6, config: {} },
  ];

  // ── JJK fields (6) ──────────────────────────────────────────
  // short_text, multi_select, single_select, rating, checkbox, email
  const jjkFields = [
    { id: 'f2000000-0000-4000-8000-000000000001', formId: JJK_FORM.id, type: 'short_text', label: 'Your name', required: true, order: 1, config: {} },
    { id: 'f2000000-0000-4000-8000-000000000002', formId: JJK_FORM.id, type: 'multi_select', label: 'Cursed techniques', required: true, order: 2, config: { options: ['Cursed Energy Manipulation', 'Dismantle', 'Blood Manipulation', 'Ten Shadows', 'Limitless', 'Idle Death Gamble'] } },
    { id: 'f2000000-0000-4000-8000-000000000003', formId: JJK_FORM.id, type: 'single_select', label: 'Jujutsu High grade', required: true, order: 3, config: { options: ['Grade 4', 'Grade 3', 'Grade 2', 'Grade 1', 'Special Grade'] } },
    { id: 'f2000000-0000-4000-8000-000000000004', formId: JJK_FORM.id, type: 'rating', label: 'Sacrifice for comrades', required: true, order: 4, config: { max: 10 } },
    { id: 'f2000000-0000-4000-8000-000000000005', formId: JJK_FORM.id, type: 'checkbox', label: 'Accept binding vow', required: true, order: 5, config: {} },
    { id: 'f2000000-0000-4000-8000-000000000006', formId: JJK_FORM.id, type: 'email', label: 'Your email', required: false, order: 6, config: {} },
  ];

  // ── Aujla fields (6) ─────────────────────────────────────────
  // short_text, dropdown, number, date, short_text(phone), email
  const aujlaFields = [
    { id: 'f3000000-0000-4000-8000-000000000001', formId: AUJLA_FORM.id, type: 'short_text', label: 'Your name', required: true, order: 1, config: {} },
    { id: 'f3000000-0000-4000-8000-000000000002', formId: AUJLA_FORM.id, type: 'dropdown', label: 'Favorite Karan Aujla song', required: true, order: 2, config: { options: ['Tauba Tauba', 'Softly', 'Wavy', 'Winning Speech', 'Boyfriend', "Admirin' You", 'White Brown Black', 'Top Fella', 'For A Reason', "Don't Worry"] } },
    { id: 'f3000000-0000-4000-8000-000000000003', formId: AUJLA_FORM.id, type: 'number', label: 'Concerts attended', required: true, order: 3, config: { min: 0, max: 50 } },
    { id: 'f3000000-0000-4000-8000-000000000004', formId: AUJLA_FORM.id, type: 'date', label: 'Concert date', required: true, order: 4, config: {} },
    { id: 'f3000000-0000-4000-8000-000000000005', formId: AUJLA_FORM.id, type: 'short_text', label: 'Phone (for VIP passes)', required: false, order: 5, config: {} },
    { id: 'f3000000-0000-4000-8000-000000000006', formId: AUJLA_FORM.id, type: 'email', label: 'Your email', required: false, order: 6, config: {} },
  ];

  // Insert fields
  for (const field of [...samuraiFields, ...jjkFields, ...aujlaFields] as Array<typeof fields.$inferInsert>) {
    await db.insert(fields).values(field).onConflictDoNothing();
  }
  console.log('[SEED] Fields seeded');

  // ── Deterministic response data ──────────────────────────────
  const samuraiAnswers = {
    warriorNames: ['Jin Sakai', 'Kazumasa', 'Yuna', 'Ishikawa', 'Masako', 'Kenji', 'Norio', 'Taka', 'Shimura', 'Tomoe'],
    fightingStyles: ['Way of the Samurai', 'Ghost Tactics', 'Balanced Path', 'The Ronin Way'],
    clans: ['Clan Sakai', 'The Ghost', "Shimura's Army", 'No Clan'],
    battles: [
      'The Siege of Castle Kaneda was my finest hour.',
      'I faced the Mongol horde at Komoda Beach.',
      'My duel with the Tengu changed everything.',
      'I liberated the farmsteads of Izuhara one by one.',
      'The Eagle Tribe pushed me to my absolute limit.',
    ],
  };

  const jjkAnswers = {
    names: ['Itadori', 'Fushiguro', 'Kugisaki', 'Gojo', 'Nanami', 'Todo', 'Maki', 'Inumaki', 'Panda', 'Yoshino'],
    techniques: ['Cursed Energy Manipulation', 'Dismantle', 'Blood Manipulation', 'Ten Shadows', 'Limitless', 'Idle Death Gamble'],
    grades: ['Grade 4', 'Grade 3', 'Grade 2', 'Grade 1', 'Special Grade'],
  };

  const aujlaAnswers = {
    names: ['Gurpreet', 'Simran', 'Jasleen', 'Harpreet', 'Amandeep', 'Manpreet', 'Rupinder', 'Baljeet', 'Harleen', 'Navneet'],
    songs: ['Tauba Tauba', 'Softly', 'Wavy', 'Winning Speech', 'Boyfriend', "Admirin' You", 'White Brown Black', 'Top Fella', 'For A Reason', "Don't Worry"],
    reasons: [
      'His lyrics connect to real emotions.',
      'The beats are pure fire every single time.',
      'Karan Aujla speaks the language of my heart.',
      'Every hook is unforgettable.',
      'He defines modern Punjabi music.',
    ],
  };

  // Seed 750 responses
  const BATCH_SIZE = 50;
  const totalResponses = 750;
  let count = 0;
  const ratingCycle = [6, 7, 7, 8, 8, 8, 9, 9, 10, 5];

  for (let i = 0; i < totalResponses && count < totalResponses; i++) {
    const formIndex = i % 3;
    let formId: string;
    let fieldSet: Array<{ id: string }>;
    let answers: Record<string, string | string[]> = {};

    if (formIndex === 0) {
      formId = SAMURAI_FORM.id;
      fieldSet = samuraiFields;
      const styleIdx = i % 10;
      const clanIdx = (i * 3) % 10;
      answers = {
        [fieldSet[0]!.id]: samuraiAnswers.warriorNames[i % 10]!,
        [fieldSet[1]!.id]: samuraiAnswers.fightingStyles[styleIdx < 3 ? 0 : styleIdx < 7 ? 1 : styleIdx < 9 ? 2 : 3]!,
        [fieldSet[2]!.id]: samuraiAnswers.clans[clanIdx < 2 ? 0 : clanIdx < 6 ? 1 : clanIdx < 8 ? 2 : 3]!,
        [fieldSet[3]!.id]: String(ratingCycle[i % 10]!),
        [fieldSet[4]!.id]: i % 3 === 0 ? samuraiAnswers.battles[i % 5]! : '',
        [fieldSet[5]!.id]: `warrior${i}@tsushima.jp`,
      };
    } else if (formIndex === 1) {
      formId = JJK_FORM.id;
      fieldSet = jjkFields;
      const gradeIdx = i % 10;
      const tech1 = jjkAnswers.techniques[(i * 2) % jjkAnswers.techniques.length]!;
      const tech2 = jjkAnswers.techniques[(i * 2 + 1) % jjkAnswers.techniques.length]!;
      answers = {
        [fieldSet[0]!.id]: `Sorcerer ${jjkAnswers.names[i % 10]!}`,
        [fieldSet[1]!.id]: i % 4 === 0 ? [tech1] : i % 4 === 1 ? [tech1, tech2] : [tech2],
        [fieldSet[2]!.id]: jjkAnswers.grades[gradeIdx < 4 ? 0 : gradeIdx < 7 ? 1 : gradeIdx < 9 ? 2 : 3]!,
        [fieldSet[3]!.id]: String(ratingCycle[(i + 3) % 10]!),
        [fieldSet[4]!.id]: i % 5 === 0 ? 'false' : 'true',
        [fieldSet[5]!.id]: `sorcerer${i}@jujutsu.jp`,
      };
    } else {
      formId = AUJLA_FORM.id;
      fieldSet = aujlaFields;
      answers = {
        [fieldSet[0]!.id]: aujlaAnswers.names[i % 10]!,
        [fieldSet[1]!.id]: aujlaAnswers.songs[i % 10]!,
        [fieldSet[2]!.id]: String([0, 0, 1, 0, 1, 2, 0, 1, 0, 3][i % 10]!),
        [fieldSet[3]!.id]: `2025-0${1 + (i % 9)}-${String(10 + (i % 20)).padStart(2, '0')}`,
        [fieldSet[4]!.id]: `+91 98${String(i).padStart(8, '0').slice(0, 8)}`,
        [fieldSet[5]!.id]: `fan${i}@aujla.in`,
      };
    }

    // Insert response
    const [response] = await db.insert(responses).values({
      formId,
      submissionHash: `seed-hash-${i}`,
      submissionHashExpiresAt: new Date(Date.now() + 30_000),
      ipAddress: `192.168.${Math.floor(i / 256)}.${i % 256}`,
      respondentEmail: `user${i}@example.com`,
      respondentName: `Respondent ${i + 1}`,
    }).returning();

    if (response) {
      const answerRows = Object.entries(answers).map(([fieldId, value]) => ({
        responseId: response.id,
        fieldId,
        value: Array.isArray(value) ? value : String(value),
      }));

      if (answerRows.length > 0) {
        await db.insert(responseAnswers).values(answerRows);
      }

      // Update response count
      await db.update(forms)
        .set({ responseCount: sql`${forms.responseCount} + 1`, viewCount: sql`${forms.viewCount} + 3` })
        .where(sql`${forms.id} = ${formId}`);
    }

    count++;

    if (count % BATCH_SIZE === 0) {
      console.log(`[SEED] ${count}/${totalResponses} responses seeded...`);
    }
  }

  console.log(`[SEED] Complete — ${count} responses seeded across 3 forms`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('[SEED] Error:', err);
  process.exit(1);
});