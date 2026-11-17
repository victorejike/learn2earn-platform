import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Context } from '../context.js';
import { query, queryOne } from '../db.js';

type UserRow = Record<string, string>;

export function signToken(user: UserRow): string {
  const opts: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
  };
  return jwt.sign(
    {
      userId:   user.id,
      role:     user.role,
      username: user.username,
      orgId:    user.org_id    ?? null,
      campusId: user.campus_id ?? null,
    },
    process.env.JWT_SECRET ?? 'dev-secret',
    opts
  );
}

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.user) return null;
      return queryOne(
        'SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL',
        [ctx.user.userId]
      );
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      { input }: { input: Record<string, string> },
      _ctx: Context
    ) => {
      const { email, phone, orgId, campusId } = input;
      const cleanUsername = (input.username || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '') || `user_${Date.now()}`;
      const fullName = input.fullName || cleanUsername;
      const rawPassword = input.password || 'candidate-' + Math.random().toString(36).slice(2, 10);

      // Check if user already exists
      const existing = await queryOne<UserRow>(
        'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
        [email]
      );
      if (existing) {
        // Return existing user token to continue seamlessly
        return { token: signToken(existing), user: existing };
      }

      // Default to 1Talent org if none supplied
      let resolvedOrgId: string | null = orgId ?? null;
      if (!resolvedOrgId) {
        const defaultOrg = await queryOne<{ id: string }>(
          "SELECT id FROM organizations WHERE slug = '1talent'"
        );
        resolvedOrgId = defaultOrg?.id ?? null;
      }

      const passwordHash = await bcrypt.hash(rawPassword, 12);

      const [user] = await query<UserRow>(
        `INSERT INTO users
           (username, email, password_hash, full_name, phone, org_id, campus_id, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'APPLICANT')
         RETURNING *`,
        [cleanUsername, email, passwordHash, fullName, phone ?? null,
         resolvedOrgId, campusId ?? null]
      );

      return { token: signToken(user), user };
    },

    login: async (
      _: unknown,
      { email, password, orgSlug }: { email: string; password: string; orgSlug?: string }
    ) => {
      let user: UserRow | null;

      if (orgSlug) {
        // Scoped login — email must match within that specific org
        user = await queryOne<UserRow>(
          `SELECT u.* FROM users u
           JOIN organizations o ON u.org_id = o.id
           WHERE u.email = $1 AND o.slug = $2 AND u.deleted_at IS NULL`,
          [email, orgSlug]
        );
      } else {
        user = await queryOne<UserRow>(
          'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1',
          [email]
        );
      }

      if (!user) throw new Error('Invalid credentials');

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) throw new Error('Invalid credentials');

      await query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [user.id]);

      return { token: signToken(user), user };
    },
  },
};
