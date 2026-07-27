import { query } from "../../config/db";
import { ApiError } from "../../utils/ApiError";
import { comparePassword, hashPassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";
import type { UserRecord } from "../../types";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

type UserWithOrg = UserRecord & { organization_name: string | null };

const USER_SELECT = `
  SELECT u.*, o.name AS organization_name
  FROM users u
  LEFT JOIN organizations o ON o.id = u.organization_id
`;

function toPublicUser(user: UserWithOrg) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organization_id,
    organizationName: user.organization_name,
    points: user.points,
    createdAt: user.created_at,
  };
}

export async function registerUser(input: RegisterInput) {
  const existing = await query<UserRecord>("SELECT id FROM users WHERE email = $1", [
    input.email.toLowerCase(),
  ]);
  if (existing.rowCount) {
    throw ApiError.conflict("Ja existe uma conta cadastrada com este e-mail");
  }

  const passwordHash = await hashPassword(input.password);

  const result = await query<UserRecord>(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'tourist')
     RETURNING *`,
    [input.name, input.email.toLowerCase(), passwordHash]
  );

  const user = result.rows[0];
  const token = signToken({ sub: user.id, role: user.role, organizationId: null });

  return { user: toPublicUser({ ...user, organization_name: null }), token };
}

export async function loginUser(input: LoginInput) {
  const result = await query<UserWithOrg>(`${USER_SELECT} WHERE u.email = $1`, [
    input.email.toLowerCase(),
  ]);
  const user = result.rows[0];

  if (!user) {
    throw ApiError.unauthorized("E-mail ou senha invalidos");
  }

  const validPassword = await comparePassword(input.password, user.password_hash);
  if (!validPassword) {
    throw ApiError.unauthorized("E-mail ou senha invalidos");
  }

  const token = signToken({ sub: user.id, role: user.role, organizationId: user.organization_id });
  return { user: toPublicUser(user), token };
}

export async function getUserProfile(userId: string) {
  const result = await query<UserWithOrg>(`${USER_SELECT} WHERE u.id = $1`, [userId]);
  const user = result.rows[0];
  if (!user) {
    throw ApiError.notFound("Usuario nao encontrado");
  }
  return toPublicUser(user);
}
