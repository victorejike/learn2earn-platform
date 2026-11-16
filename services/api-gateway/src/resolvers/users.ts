import type { Context } from '../context.js';
import { query, queryOne } from '../db.js';

export const userResolvers = {
  Query: {
    users: async (
      _: unknown,
      { role, status, limit = 50, offset = 0 }: { role?: string; status?: string; limit?: number; offset?: number },
      ctx: Context
    ) => {
      if (!ctx.user) throw new Error('Unauthorized');
      let sql = 'SELECT * FROM users WHERE deleted_at IS NULL';
      const params: unknown[] = [];
      if (role) { params.push(role.toLowerCase()); sql += ` AND role = $${params.length}`; }
      if (status) { params.push(status.toLowerCase()); sql += ` AND status = $${params.length}`; }
      params.push(limit, offset);
      sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
      return query(sql, params);
    },
    user: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      if (!ctx.user) throw new Error('Unauthorized');
      return queryOne('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
    },
  },
  Mutation: {
    updateUserRole: async (_: unknown, { userId, role }: { userId: string; role: string }, ctx: Context) => {
      if (!ctx.user || !['admin', 'head_of_campus'].includes(ctx.user.role)) throw new Error('Forbidden');
      const [user] = await query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
        [role.toLowerCase(), userId]
      );
      return user;
    },
    updateUserStatus: async (_: unknown, { userId, status }: { userId: string; status: string }, ctx: Context) => {
      if (!ctx.user || !['admin', 'head_of_campus', 'campus_staff'].includes(ctx.user.role)) throw new Error('Forbidden');
      const [user] = await query(
        'UPDATE users SET status = $1 WHERE id = $2 RETURNING *',
        [status.toLowerCase(), userId]
      );
      return user;
    },
  },
};
