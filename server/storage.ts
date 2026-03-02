import { db } from "./db";
import { 
  users, tools, userTools, gameState,
  type User, type InsertUser, type Tool, type InsertTool, type UserTool, type GameState,
  type UserToolWithTool
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { nullable } from "zod";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, credits: number, health: number, score: number): Promise<User>;
  
  getTools(): Promise<Tool[]>;
  getTool(id: number): Promise<Tool | undefined>;
  createTool(tool: InsertTool): Promise<Tool>;
  updateToolBid(id: number, bid: number, bidderId: number): Promise<Tool>;
  updateToolStatus(id: number, status: string): Promise<Tool>;
  
  getUserTools(): Promise<UserToolWithTool[]>;
  getUserTool(id: number): Promise<UserTool | undefined>;
  placeUserTool(id: number, layer: number, moveCount: number): Promise<UserTool>;
  assignToolToUser(userId: number, toolId: number): Promise<UserTool>;
  
  getGameState(): Promise<GameState>;
  updateGameState(phase: string, attackStrength: number): Promise<GameState>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.score), desc(users.credits));
  }

  async updateUser(id: number, credits: number, health: number, score: number): Promise<User> {
    const [user] = await db.update(users).set({ credits, security_health: health, score }).where(eq(users.id, id)).returning();
    return user;
  }

  async getTools(): Promise<Tool[]> {
    return await db.select().from(tools).orderBy(tools.id);
  }

  async getTool(id: number): Promise<Tool | undefined> {
    const [tool] = await db.select().from(tools).where(eq(tools.id, id));
    return tool;
  }

  async createTool(tool: InsertTool): Promise<Tool> {
    const [t] = await db.insert(tools).values(tool).returning();
    return t;
  }

  async updateToolBid(id: number, bid: number, bidderId: number): Promise<Tool> {
    const [t] = await db.update(tools)
      .set({ 
        current_bid: bid, 
        highest_bidder_id: bidderId,
        last_bid_at: new Date()
      })
      .where(eq(tools.id, id))
      .returning();
    return t;
  }

  async updateToolStatus(id: number, status: string, auctionEndAt?: Date | null): Promise<Tool> {
    const updateData: any = { status };
    if (auctionEndAt !== undefined) updateData.auction_end_at = auctionEndAt;
    const [t] = await db.update(tools).set(updateData).where(eq(tools.id, id)).returning();
    return t;
  }

  async getUserTools(): Promise<UserToolWithTool[]> {
    const results = await db.select({
      userTool: userTools,
      tool: tools
    }).from(userTools).innerJoin(tools, eq(userTools.tool_id, tools.id));
    
    return results.map(r => ({
      ...r.userTool,
      tool: r.tool
    }));
  }

  async getUserTool(id: number): Promise<UserTool | undefined> {
    const [ut] = await db.select().from(userTools).where(eq(userTools.id, id));
    return ut;
  }

  async placeUserTool(id: number, layer: number | null): Promise<UserTool> {
    const [ut] = await db.update(userTools).set({ layer, placed_at: new Date() }).where(eq(userTools.id, id)).returning();
    return ut;
  }

  async assignToolToUser(userId: number, toolId: number): Promise<UserTool> {

    const tool = await this.getTool(toolId);
    if (!tool) throw new Error("Tool not found");

    const [ut] = await db.insert(userTools)
      .values({
        user_id: userId,
        tool_id: toolId,
        layer: null,
        current_strength: tool.strength   // VERY IMPORTANT
      })
      .returning();

    return ut;
  }

  async getGameState(): Promise<GameState> {
    let [state] = await db.select().from(gameState).limit(1);
    if (!state) {
      [state] = await db.insert(gameState).values({ phase: 'auction', current_attack_strength: 0, active_tool_id: null }).returning();
    }
    return state;
  }

  async updateGameState(phase: string, attackStrength: number, activeToolId?: number | null): Promise<GameState> {
    let [state] = await db.select().from(gameState).limit(1);
    if (!state) {
      [state] = await db.insert(gameState).values({ phase, current_attack_strength: attackStrength, active_tool_id: activeToolId }).returning();
    } else {
      const updateData: any = { phase, current_attack_strength: attackStrength };
      if (activeToolId !== undefined) updateData.active_tool_id = activeToolId;
      [state] = await db.update(gameState).set(updateData).where(eq(gameState.id, state.id)).returning();
    }
    return state;
  }

  async resetToolForAuction(toolId: number, auctionEndAt: Date) {
    await db.update(tools)
      .set({
        status: "active",
        auction_end_at: auctionEndAt,
        highest_bidder_id: null,
        last_bid_at: null,
        current_bid: 0   // <-- VERY IMPORTANT
      })
      .where(eq(tools.id, toolId));
  }

  async updateUserToolStrength(userToolId: number, strength: number) {
    await db
      .update(userTools)
      .set({ current_strength: strength })
      .where(eq(userTools.id, userToolId));
  }
}

export const storage = new DatabaseStorage();