import type { Context } from '../context.js';
import { query, queryOne } from '../db.js';

export const campusResolvers = {
  Query: {
    // List campuses for the caller's org (or any org if super_admin)
    campuses: async (
      _: unknown,
      { orgSlug }: { orgSlug?: string },
      ctx: Context
    ) => {
      if (!ctx.user) throw new Error('Unauthorized');

      let orgId: string;

      if (orgSlug) {
        if (ctx.user.role !== 'super_admin') throw new Error('Forbidden');
        const org = await queryOne<{ id: string }>(
          'SELECT id FROM organizations WHERE slug = $1',
          [orgSlug]
        );
        if (!org) throw new Error('Organization not found');
        orgId = org.id;
      } else {
        if (!ctx.user.orgId) throw new Error('No organization context');
        orgId = ctx.user.orgId;
      }

      return query(
        `SELECT c.*,
           (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.role = 'student') AS "studentCount",
           (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.status = 'active') AS "activeCount",
           (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.status = 'at_risk') AS "atRiskCount"
         FROM campuses c
         WHERE c.org_id = $1
         ORDER BY c.created_at ASC`,
        [orgId]
      );
    },

    campus: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return queryOne(
        `SELECT c.*,
           (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.role = 'student') AS "studentCount",
           (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.status = 'active') AS "activeCount",
           (SELECT COUNT(*) FROM users u WHERE u.campus_id = c.id AND u.status = 'at_risk') AS "atRiskCount"
         FROM campuses c WHERE c.id = $1`,
        [id]
      );
    },
  },

  Mutation: {
    createCampus: async (
      _: unknown,
      { input }: { input: Record<string, unknown> },
      ctx: Context
    ) => {
      if (!ctx.user) throw new Error('Unauthorized');

      // org admin or super_admin can create campuses
      const allowed = ['super_admin', 'admin', 'head_of_campus'];
      if (!allowed.includes(ctx.user.role)) throw new Error('Forbidden');

      const { orgId, slug, name, description, city, country, timezone, isVirtual, maxStudents } = input;

      // If not super_admin, can only create in their own org
      const targetOrgId = ctx.user.role === 'super_admin' ? orgId : ctx.user.orgId;

      const [campus] = await query(
        `INSERT INTO campuses
           (org_id, slug, name, description, city, country, timezone, is_virtual, max_students, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [targetOrgId, slug, name, description ?? null,
         city ?? null, country ?? null, timezone ?? 'Africa/Lagos',
         isVirtual ?? false, maxStudents ?? null, ctx.user.userId]
      );
      return { ...campus, studentCount: 0, activeCount: 0, atRiskCount: 0 };
    },

    updateCampusStatus: async (
      _: unknown,
      { campusId, status }: { campusId: string; status: string },
      ctx: Context
    ) => {
      if (!ctx.user) throw new Error('Unauthorized');
      const allowed = ['super_admin', 'admin', 'head_of_campus'];
      if (!allowed.includes(ctx.user.role)) throw new Error('Forbidden');
      const [campus] = await query(
        'UPDATE campuses SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, campusId]
      );
      return campus;
    },

    assignUserToCampus: async (
      _: unknown,
      { userId, campusId }: { userId: string; campusId: string },
      ctx: Context
    ) => {
      if (!ctx.user) throw new Error('Unauthorized');
      const allowed = ['super_admin', 'admin', 'head_of_campus', 'campus_staff'];
      if (!allowed.includes(ctx.user.role)) throw new Error('Forbidden');
      const [user] = await query(
        'UPDATE users SET campus_id = $1 WHERE id = $2 RETURNING *',
        [campusId, userId]
      );
      return user;
    },
  },
};
