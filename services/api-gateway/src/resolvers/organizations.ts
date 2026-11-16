import type { Context } from '../context.js';
import { query, queryOne } from '../db.js';

export const organizationResolvers = {
  Query: {
    organizations: async (
      _: unknown,
      { limit = 50, offset = 0 }: { limit?: number; offset?: number },
      ctx: Context
    ) => {
      if (!ctx.user || ctx.user.role !== 'super_admin') throw new Error('Forbidden: super_admin only');
      return query(
        `SELECT o.*,
           (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id AND u.role = 'student') AS "studentCount"
         FROM organizations o
         ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
    },

    organization: async (_: unknown, { slug }: { slug: string }, ctx: Context) => {
      if (!ctx.user) throw new Error('Unauthorized');
      // super_admin can see any org; others can only see their own
      const org = await queryOne<Record<string, unknown>>(
        `SELECT o.*,
           (SELECT COUNT(*) FROM users u WHERE u.org_id = o.id AND u.role = 'student') AS "studentCount"
         FROM organizations o WHERE o.slug = $1`,
        [slug]
      );
      if (!org) return null;
      if (ctx.user.role !== 'super_admin' && org.id !== ctx.user.orgId) {
        throw new Error('Forbidden');
      }
      return org;
    },
  },

  Mutation: {
    createOrganization: async (
      _: unknown,
      { input }: { input: Record<string, unknown> },
      ctx: Context
    ) => {
      if (!ctx.user || ctx.user.role !== 'super_admin') throw new Error('Forbidden: super_admin only');
      const { slug, name, description, country, city, plan, maxStudents, customDomain } = input;
      const [org] = await query(
        `INSERT INTO organizations
           (slug, name, description, country, city, plan, max_students, custom_domain, status, trial_ends_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,
           CASE WHEN $6 = 'trial' THEN 'trial' ELSE 'active' END,
           CASE WHEN $6 = 'trial' THEN NOW() + INTERVAL '30 days' ELSE NULL END
         ) RETURNING *`,
        [slug, name, description ?? null, country ?? null, city ?? null,
         plan, maxStudents ?? 50, customDomain ?? null]
      );
      return { ...org, studentCount: 0 };
    },

    updateOrganizationPlan: async (
      _: unknown,
      { orgId, plan }: { orgId: string; plan: string },
      ctx: Context
    ) => {
      if (!ctx.user || ctx.user.role !== 'super_admin') throw new Error('Forbidden');
      const [org] = await query(
        'UPDATE organizations SET plan = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [plan, orgId]
      );
      return org;
    },

    suspendOrganization: async (
      _: unknown,
      { orgId }: { orgId: string },
      ctx: Context
    ) => {
      if (!ctx.user || ctx.user.role !== 'super_admin') throw new Error('Forbidden');
      const [org] = await query(
        "UPDATE organizations SET status = 'suspended', updated_at = NOW() WHERE id = $1 RETURNING *",
        [orgId]
      );
      return org;
    },
  },
};
