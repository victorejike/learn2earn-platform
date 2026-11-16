import type { Context } from '../context.js';
import { query, queryOne } from '../db.js';

export const projectResolvers = {
  Query: {
    projects: async (_: unknown, { limit = 50, offset = 0 }: { limit?: number; offset?: number }) => {
      return query('SELECT * FROM projects WHERE is_active = true ORDER BY created_at ASC LIMIT $1 OFFSET $2', [limit, offset]);
    },
    project: async (_: unknown, { slug }: { slug: string }) => {
      return queryOne('SELECT * FROM projects WHERE slug = $1 AND is_active = true', [slug]);
    },
    myProjects: async (_: unknown, __: unknown, ctx: Context) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return query(
        `SELECT sp.*, row_to_json(p.*) as project, row_to_json(u.*) as user
         FROM student_projects sp
         JOIN projects p ON sp.project_id = p.id
         JOIN users u ON sp.user_id = u.id
         WHERE sp.user_id = $1
         ORDER BY sp.created_at DESC`,
        [ctx.user.userId]
      );
    },
  },
};
