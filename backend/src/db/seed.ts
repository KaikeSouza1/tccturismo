import crypto from "node:crypto";
import { pool, query } from "../config/db";
import { hashPassword } from "../utils/password";

/**
 * Dados ilustrativos para desenvolvimento/demo. As coordenadas sao
 * aproximadas do centro de Uniao da Vitoria/PR e devem ser ajustadas para a
 * localizacao real de cada ponto (via painel administrativo) antes de
 * qualquer uso em campo com turistas reais.
 */
const DEFAULT_ORG = { name: "Uniao da Vitoria", slug: "uniao-da-vitoria" };

const SEED_ATTRACTIONS = [
  {
    name: "Catedral Sagrado Coracao de Jesus",
    description: "Principal referencia religiosa e arquitetonica do centro da cidade.",
    category: "cultural",
    latitude: -26.2296,
    longitude: -51.0881,
  },
  {
    name: "Estacao Ferroviaria de Uniao da Vitoria",
    description: "Antiga estacao ligada a historia ferroviaria da regiao.",
    category: "historico",
    latitude: -26.231,
    longitude: -51.0862,
  },
  {
    name: "Orla do Rio Iguacu",
    description: "Area as margens do Rio Iguacu, divisa natural com Porto Uniao/SC.",
    category: "natureza",
    latitude: -26.2265,
    longitude: -51.085,
  },
  {
    name: "Praca Coronel Amazonas",
    description: "Praca central, ponto de encontro e eventos da cidade.",
    category: "lazer",
    latitude: -26.2288,
    longitude: -51.0895,
  },
  {
    name: "Ponte Pensil sobre o Rio Iguacu",
    description: "Ponte historica que liga Uniao da Vitoria a Porto Uniao.",
    category: "historico",
    latitude: -26.232,
    longitude: -51.084,
  },
];

/**
 * As 10 conquistas fixas da plataforma (organization_id = NULL). Ficam
 * disponiveis para turistas de qualquer organizacao e sao avaliadas com base
 * em estatisticas globais (todas as organizacoes), o que as mantem validas
 * mesmo quando novos municipios/organizacoes se cadastram na plataforma.
 * Cada organizacao pode, alem destas, criar ate 10 conquistas proprias.
 */
const FIXED_ACHIEVEMENTS = [
  {
    code: "primeiro_carimbo",
    name: "Primeiro Carimbo",
    description: "Registre sua primeira visita a um atrativo turistico.",
    icon: "Footprints",
    criteria_type: "attractions_visited_count",
    criteria_value: { count: 1 },
    points: 10,
  },
  {
    code: "explorador_iniciante",
    name: "Explorador Iniciante",
    description: "Visite 3 atrativos diferentes.",
    icon: "Compass",
    criteria_type: "attractions_visited_count",
    criteria_value: { count: 3 },
    points: 20,
  },
  {
    code: "caminhante_dedicado",
    name: "Caminhante Dedicado",
    description: "Visite 5 atrativos diferentes.",
    icon: "Map",
    criteria_type: "attractions_visited_count",
    criteria_value: { count: 5 },
    points: 35,
  },
  {
    code: "guia_local",
    name: "Guia Local",
    description: "Visite 10 atrativos diferentes.",
    icon: "Backpack",
    criteria_type: "attractions_visited_count",
    criteria_value: { count: 10 },
    points: 60,
  },
  {
    code: "viajante_frequente",
    name: "Viajante Frequente",
    description: "Visite 20 atrativos diferentes.",
    icon: "Navigation",
    criteria_type: "attractions_visited_count",
    criteria_value: { count: 20 },
    points: 100,
  },
  {
    code: "olhar_curioso",
    name: "Olhar Curioso",
    description: "Visite atrativos de ao menos 2 categorias diferentes.",
    icon: "Eye",
    criteria_type: "distinct_categories_count",
    criteria_value: { count: 2 },
    points: 25,
  },
  {
    code: "explorador_completo",
    name: "Explorador Completo",
    description: "Visite atrativos de todas as categorias existentes.",
    icon: "Star",
    criteria_type: "distinct_categories_count",
    criteria_value: { count: 4 },
    points: 70,
  },
  {
    code: "turista_regional",
    name: "Turista Regional",
    description: "Visite atrativos de 2 organizacoes/municipios diferentes.",
    icon: "MapPin",
    criteria_type: "distinct_organizations_count",
    criteria_value: { count: 2 },
    points: 50,
  },
  {
    code: "rota_estendida",
    name: "Rota Estendida",
    description: "Visite atrativos de 3 organizacoes/municipios diferentes.",
    icon: "Route",
    criteria_type: "distinct_organizations_count",
    criteria_value: { count: 3 },
    points: 90,
  },
  {
    code: "trajetoria_de_destaque",
    name: "Trajetoria de Destaque",
    description: "Acumule 300 pontos de experiencia na plataforma.",
    icon: "Trophy",
    criteria_type: "points_total",
    criteria_value: { points: 300 },
    points: 50,
  },
];

async function seedOrganization(): Promise<string> {
  const existing = await query<{ id: string }>("SELECT id FROM organizations WHERE slug = $1", [
    DEFAULT_ORG.slug,
  ]);
  if (existing.rowCount) {
    return existing.rows[0].id;
  }
  const result = await query<{ id: string }>(
    "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id",
    [DEFAULT_ORG.name, DEFAULT_ORG.slug]
  );
  console.log(`+ organizacao criada: ${DEFAULT_ORG.name}`);
  return result.rows[0].id;
}

async function seedUsers(organizationId: string) {
  const admins = [
    {
      name: "Administrador",
      email: "admin@turismolocal.com.br",
      password: "admin123",
      role: "admin",
    },
  ];
  const tourists = [
    {
      name: "Turista Demonstracao",
      email: "turista@turismolocal.com.br",
      password: "turista123",
      role: "tourist",
    },
  ];

  for (const u of [...admins, ...tourists]) {
    const existing = await query("SELECT id FROM users WHERE email = $1", [u.email]);
    if (existing.rowCount) {
      console.log(`- usuario ${u.email} ja existe, pulando`);
      continue;
    }
    const passwordHash = await hashPassword(u.password);
    await query(
      "INSERT INTO users (name, email, password_hash, role, organization_id) VALUES ($1, $2, $3, $4, $5)",
      [u.name, u.email, passwordHash, u.role, u.role === "admin" ? organizationId : null]
    );
    console.log(`+ usuario criado: ${u.email} / senha: ${u.password}`);
  }
}

async function seedPlatformAdmin() {
  const email = "kaikeesmael02@gmail.com";
  const passwordHash = await hashPassword("082572abc");
  const existing = await query<{ id: string }>("SELECT id FROM users WHERE email = $1", [email]);

  if (existing.rowCount) {
    await query(
      "UPDATE users SET role = 'platform_admin', organization_id = NULL, password_hash = $1, updated_at = now() WHERE email = $2",
      [passwordHash, email]
    );
    console.log(`+ conta existente ${email} promovida a administrador da plataforma`);
    return;
  }

  await query(
    "INSERT INTO users (name, email, password_hash, role, organization_id) VALUES ($1, $2, $3, 'platform_admin', NULL)",
    ["Kaike Esmael", email, passwordHash]
  );
  console.log(`+ administrador da plataforma criado: ${email}`);
}

async function seedAttractions(organizationId: string) {
  for (const a of SEED_ATTRACTIONS) {
    const existing = await query("SELECT id FROM attractions WHERE name = $1", [a.name]);
    if (existing.rowCount) {
      console.log(`- atrativo "${a.name}" ja existe, pulando`);
      continue;
    }
    const qrToken = `TCC-${crypto.randomBytes(12).toString("hex")}`;
    await query(
      `INSERT INTO attractions (organization_id, name, description, category, latitude, longitude, qr_code_token)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [organizationId, a.name, a.description, a.category, a.latitude, a.longitude, qrToken]
    );
    console.log(`+ atrativo criado: ${a.name} (qr: ${qrToken})`);
  }
}

async function seedAchievements() {
  for (const ach of FIXED_ACHIEVEMENTS) {
    const existing = await query("SELECT id FROM achievements WHERE code = $1", [ach.code]);
    if (existing.rowCount) {
      console.log(`- conquista "${ach.code}" ja existe, pulando`);
      continue;
    }
    await query(
      `INSERT INTO achievements (code, name, description, icon, criteria_type, criteria_value, points)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ach.code, ach.name, ach.description, ach.icon, ach.criteria_type, ach.criteria_value, ach.points]
    );
    console.log(`+ conquista criada: ${ach.name}`);
  }
}

async function main() {
  const organizationId = await seedOrganization();
  await seedUsers(organizationId);
  await seedPlatformAdmin();
  await seedAttractions(organizationId);
  await seedAchievements();
}

main()
  .then(async () => {
    console.log("Seed concluido.");
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Falha no seed:", err);
    await pool.end();
    process.exit(1);
  });
