import { z } from 'zod';
import { insertUserSchema, users, tools, userTools, gameState, type UserToolWithTool } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  badRequest: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    register: { method: 'POST' as const, path: '/api/auth/register', input: insertUserSchema, responses: { 201: z.custom<typeof users.$inferSelect>(), 400: errorSchemas.validation } },
    login: { method: 'POST' as const, path: '/api/auth/login', input: insertUserSchema, responses: { 200: z.custom<typeof users.$inferSelect>(), 401: errorSchemas.badRequest } },
    me: { method: 'GET' as const, path: '/api/auth/me', responses: { 200: z.custom<typeof users.$inferSelect>(), 401: errorSchemas.badRequest } },
    logout: { method: 'POST' as const, path: '/api/auth/logout', responses: { 200: z.object({ message: z.string() }) } },
  },
  users: {
    list: { method: 'GET' as const, path: '/api/users', responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) } },
  },
  tools: {
    list: { method: 'GET' as const, path: '/api/tools', responses: { 200: z.array(z.custom<typeof tools.$inferSelect>()) } },
    get: { method: 'GET' as const, path: '/api/tools/:id', responses: { 200: z.custom<typeof tools.$inferSelect>(), 404: errorSchemas.notFound } },
    bid: { 
      method: 'POST' as const, 
      path: '/api/tools/:id/bid', 
      input: z.object({ amount: z.coerce.number() }), 
      responses: { 200: z.custom<typeof tools.$inferSelect>(), 400: errorSchemas.badRequest } 
    },
  },
  userTools: {
    list: { method: 'GET' as const, path: '/api/user-tools', responses: { 200: z.array(z.custom<UserToolWithTool>()) } },
    place: { 
      method: 'POST' as const, 
      path: '/api/user-tools/:id/place', 
      input: z.object({ layer: z.coerce.number().min(1).max(3) }), 
      responses: { 200: z.custom<typeof userTools.$inferSelect>(), 400: errorSchemas.badRequest } 
    }
  },
  game: {
    state: { method: 'GET' as const, path: '/api/game/state', responses: { 200: z.custom<typeof gameState.$inferSelect>() } },
    advance: { 
      method: 'POST' as const, 
      path: '/api/game/advance', 
      input: z.object({ 
        phase: z.string(), 
        attack_strength: z.coerce.number().optional(),
        active_tool_id: z.coerce.number().optional().nullable()
      }), 
      responses: { 200: z.custom<typeof gameState.$inferSelect>(), 400: errorSchemas.badRequest } 
    },
    startAuction: {
      method: 'POST' as const,
      path: '/api/game/auction/start/:toolId',
      responses: { 200: z.custom<typeof gameState.$inferSelect>(), 400: errorSchemas.badRequest }
    },
    closeAuction: {
      method: 'POST' as const,
      path: '/api/game/auction/close',
      responses: { 200: z.custom<typeof gameState.$inferSelect>(), 400: errorSchemas.badRequest }
    },
    runAttack: {
      method: 'POST' as const,
      path: '/api/game/attack',
      responses: { 200: z.object({ message: z.string() }), 400: errorSchemas.badRequest }
    },
    confirmDefense: {
      method: 'POST' as const,
      path: '/api/user-tools/confirm',
      input: z.object({
        layout: z.record(z.union([z.number(), z.null()]))
      }),
      responses: {
        200: z.object({
          success: z.boolean()
        }),
        400: errorSchemas.badRequest
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
