import { pool, query } from "../config/db";
import { createAttraction } from "../modules/attractions/attractions.service";
import { createOrganizationAchievement } from "../modules/achievements/achievements.service";
import { registerUser } from "../modules/auth/auth.service";
import { registerVisit } from "../modules/visits/visits.service";

/**
 * Popula a organizacao "Organizacao Prototipo Teste" (criada via create-org)
 * com atrativos, conquistas proprias, turistas e visitas de teste, todos
 * nomeados no padrao "[tipo] N Prototipo" para deixar claro que sao dados
 * ilustrativos usados apenas para capturar prints do prototipo, nao dados
 * reais de producao. Nao altera nenhuma logica do app: usa exatamente os
 * mesmos service functions que a API real usa.
 *
 * Uso: npx tsx src/db/seed-prototype.ts
 * (requer que "npm run create-org -- --org "Organizacao Prototipo Teste" ..."
 * ja tenha sido executado antes)
 */

const ORG_SLUG = "organizacao-prototipo-teste";

async function main() {
  const orgResult = await query<{ id: string; name: string }>(
    "SELECT id, nome AS name FROM organizacoes WHERE slug = $1",
    [ORG_SLUG]
  );
  const org = orgResult.rows[0];
  if (!org) {
    throw new Error(
      `Organizacao "${ORG_SLUG}" nao encontrada. Rode antes: npm run create-org -- --org "Organizacao Prototipo Teste" --admin-name "Administrador Prototipo" --admin-email admin.prototipo@teste.com --admin-password prototipo123`
    );
  }
  console.log(`Usando organizacao: ${org.name} (${org.id})`);

  // 1. Atrativos
  const baseLat = -25.5;
  const baseLng = -50.5;
  const categories = ["Categoria Prototipo 1", "Categoria Prototipo 2", "Categoria Prototipo 3"];
  const attractions: { id: string; name: string; latitude: number; longitude: number; qrToken: string }[] = [];

  for (let i = 1; i <= 6; i++) {
    const latitude = baseLat + i * 0.004;
    const longitude = baseLng + i * 0.004;
    const created = await createAttraction(org.id, {
      name: `Local Prototipo Teste ${i}`,
      description: `Atrativo turistico ilustrativo numero ${i}, usado apenas para preencher o prototipo com dados de teste.`,
      category: categories[(i - 1) % categories.length],
      latitude,
      longitude,
      radiusMeters: 60,
    });
    const tokenResult = await query<{ qr_code_token: string }>(
      "SELECT token_qr_code AS qr_code_token FROM atrativos WHERE id = $1",
      [created.id]
    );
    attractions.push({
      id: created.id,
      name: created.name,
      latitude,
      longitude,
      qrToken: tokenResult.rows[0].qr_code_token,
    });
    console.log(`+ atrativo criado: ${created.name}`);
  }

  // 2. Conquistas proprias da organizacao
  const achievementDefs = [
    { name: "Conquista 1 Prototipo", description: "Registre 1 visita de teste.", icon: "Footprints", points: 10, count: 1 },
    { name: "Conquista 2 Prototipo", description: "Registre 3 visitas de teste.", icon: "Compass", points: 20, count: 3 },
    { name: "Conquista 3 Prototipo", description: "Registre 5 visitas de teste.", icon: "Star", points: 30, count: 5 },
  ];
  for (const def of achievementDefs) {
    await createOrganizationAchievement(org.id, {
      name: def.name,
      description: def.description,
      icon: def.icon,
      points: def.points,
      criteriaType: "attractions_visited_count",
      criteriaValue: { count: def.count },
    });
    console.log(`+ conquista criada: ${def.name}`);
  }

  // 3. Turistas de teste
  async function ensureTourist(name: string, email: string, password: string) {
    const existing = await query<{ id: string }>("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (existing.rowCount) {
      console.log(`= usuario ja existia: ${email}`);
      return existing.rows[0].id;
    }
    const { user } = await registerUser({ name, email, password });
    console.log(`+ usuario criado: ${email} / senha: ${password}`);
    return user.id;
  }

  const user1Id = await ensureTourist("Usuario 1 Prototipo", "usuario1.prototipo@teste.com", "prototipo123");
  const user2Id = await ensureTourist("Usuario 2 Prototipo", "usuario2.prototipo@teste.com", "prototipo123");

  // 4. Visitas: usuario 1 visita todos os 6 (desbloqueia mais conquistas),
  // usuario 2 visita so 2 (fica atras no ranking, mas nao fica zerado).
  async function registerVisits(userId: string, label: string, count: number) {
    for (let i = 0; i < count; i++) {
      const attraction = attractions[i];
      try {
        await registerVisit(userId, {
          qrToken: attraction.qrToken,
          latitude: attraction.latitude,
          longitude: attraction.longitude,
        });
        console.log(`+ visita registrada: ${label} -> ${attraction.name}`);
      } catch (err) {
        console.log(`= visita ja existia ou falhou (${label} -> ${attraction.name}): ${(err as Error).message}`);
      }
    }
  }

  await registerVisits(user1Id, "Usuario 1 Prototipo", 6);
  await registerVisits(user2Id, "Usuario 2 Prototipo", 2);

  console.log("\nSeed de prototipo concluido.");
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Falha ao popular dados de prototipo:", err);
    await pool.end();
    process.exit(1);
  });
