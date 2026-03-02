import { pgTable, text, serial, integer, timestamp, doublePrecision, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").notNull().default(1000),
  security_health: integer("security_health").notNull().default(100),
  score: doublePrecision("score").notNull().default(0),
  is_coordinator: boolean("is_coordinator").notNull().default(false),
});

export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  strength: integer("strength").notNull(),
  base_price: integer("base_price").notNull(),
  status: text("status").notNull().default('pending'), // pending, active, sold
  current_bid: integer("current_bid").notNull().default(0),
  highest_bidder_id: integer("highest_bidder_id"),
  auction_end_at: timestamp("auction_end_at"),
  last_bid_at: timestamp("last_bid_at"),
});

export const userTools = pgTable("user_tools", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull(),
  tool_id: integer("tool_id").notNull(),
  layer: integer("layer"), // 1, 2, 3
  current_strength: integer("current_strength").notNull(),
  placed_at: timestamp("placed_at").defaultNow(), // to track if moved
});

export const gameState = pgTable("game_state", {
  id: serial("id").primaryKey(),
  phase: text("phase").notNull().default('auction'), // auction, placement, attack_1, attack_2, attack_3, finished
  current_attack_strength: integer("current_attack_strength").default(0),
  active_tool_id: integer("active_tool_id"), // The tool currently being auctioned
});

export const usersRelations = relations(users, ({ many }) => ({
  tools: many(userTools),
}));

export const insertUserSchema = createInsertSchema(users).pick({ username: true, password: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertToolSchema = createInsertSchema(tools).omit({ id: true });
export type InsertTool = z.infer<typeof insertToolSchema>;
export type Tool = typeof tools.$inferSelect;

export const insertUserToolSchema = createInsertSchema(userTools).omit({ id: true });
export type UserTool = typeof userTools.$inferSelect;

export type UserToolWithTool = UserTool & { tool: Tool };

export const insertGameStateSchema = createInsertSchema(gameState).omit({ id: true });
export type GameState = typeof gameState.$inferSelect;

export type BidRequest = { amount: number };
export type PlaceToolRequest = { layer: number }; 
export type AdvancePhaseRequest = { phase: string, attack_strength?: number, active_tool_id?: number };
