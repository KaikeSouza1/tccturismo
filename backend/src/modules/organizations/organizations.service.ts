import { query } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { hashPassword } from "../../utils/password";
import type { OrganizationRecord } from "../../types";

interface CreateOrganizationInput {
  name: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listOrganizationsWithStats() {
  const result = await query<{
    id: string;
    name: string;
    slug: string;
    created_at: Date;
    admin_email: string | null;
    attractions_count: string;
  }>(`
    SELECT o.id, o.name, o.slug, o.created_at,
      (SELECT u.email FROM users u WHERE u.organization_id = o.id AND u.role = 'admin' ORDER BY u.created_at ASC LIMIT 1) AS admin_email,
      (SELECT COUNT(*) FROM attractions a WHERE a.organization_id = o.id)::text AS attractions_count
    FROM organizations o
    ORDER BY o.created_at DESC
  `);
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    adminEmail: row.admin_email,
    attractionsCount: Number(row.attractions_count),
  }));
}

export async function createOrganizationWithAdmin(input: CreateOrganizationInput) {
  const slug = slugify(input.name);
  if (!slug) {
    throw ApiError.badRequest("Nome de organizacao invalido");
  }

  const existingOrg = await query<{ id: string }>("SELECT id FROM organizations WHERE slug = $1", [
    slug,
  ]);
  if (existingOrg.rowCount) {
    throw ApiError.conflict("Ja existe uma organizacao com um nome muito parecido");
  }

  const existingUser = await query<{ id: string }>("SELECT id FROM users WHERE email = $1", [
    input.adminEmail.toLowerCase(),
  ]);
  if (existingUser.rowCount) {
    throw ApiError.conflict("Ja existe uma conta cadastrada com este e-mail");
  }

  const orgResult = await query<OrganizationRecord>(
    "INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING *",
    [input.name, slug]
  );
  const organization = orgResult.rows[0];

  const passwordHash = await hashPassword(input.adminPassword);
  await query(
    `INSERT INTO users (name, email, password_hash, role, organization_id)
     VALUES ($1, $2, $3, 'admin', $4)`,
    [input.adminName, input.adminEmail.toLowerCase(), passwordHash, organization.id]
  );

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    createdAt: organization.created_at,
    adminEmail: input.adminEmail.toLowerCase(),
    attractionsCount: 0,
  };
}
