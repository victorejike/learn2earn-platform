import type { Context } from '../context.js';
import { queryOne } from '../db.js';

export const dashboardResolvers = {
  Query: {
    dashboardStats: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.user) throw new Error('Unauthorized');
      const stats = await queryOne<Record<string, string>>(`
        SELECT
          COUNT(*) FILTER (WHERE role = 'student') AS "totalStudents",
          COUNT(*) FILTER (WHERE role = 'student' AND status = 'active') AS "activeStudents",
          COUNT(*) FILTER (WHERE role = 'student' AND status = 'at_risk') AS "atRiskStudents",
          COUNT(*) FILTER (WHERE role = 'student' AND status = 'graduated') AS "graduatedStudents",
          (SELECT COUNT(*) FROM cohorts WHERE status = 'active') AS "activeCohorts"
        FROM users
        WHERE deleted_at IS NULL
      `);
      return {
        totalStudents: parseInt(stats?.totalStudents ?? '0'),
        activeStudents: parseInt(stats?.activeStudents ?? '0'),
        atRiskStudents: parseInt(stats?.atRiskStudents ?? '0'),
        graduatedStudents: parseInt(stats?.graduatedStudents ?? '0'),
        activeCohorts: parseInt(stats?.activeCohorts ?? '0'),
      };
    },
  },
};
