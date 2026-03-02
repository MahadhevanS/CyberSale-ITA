import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import { eq } from "drizzle-orm";

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use(session({
    secret: process.env.SESSION_SECRET || 'super_secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  }));

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    next();
  };

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username exists" });
      }
      const user = await storage.createUser(input);
      req.session.userId = user.id;
      res.status(201).json(user);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      
      // Special check for coordinator
      if (input.username === "coordinator" && input.password === "coordinator") {
        let user = await storage.getUserByUsername("coordinator");
        if (!user) {
          user = await storage.createUser({
            username: "coordinator",
            password: "coordinator",
          });
        }
        
        // Always ensure the flag is set for this specific account
        if (!user.is_coordinator) {
          await db.update(users).set({ is_coordinator: true }).where(eq(users.id, user.id));
          user.is_coordinator = true;
        }
        
        req.session.userId = user.id;
        return res.status(200).json(user);
      }

      const user = await storage.getUserByUsername(input.username);
      if (!user || user.password !== input.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.userId = user.id;
      res.status(200).json(user);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    res.status(200).json(user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.status(200).json({ message: "Logged out" });
    });
  });

  app.get(api.users.list.path, async (req, res) => {
    const allUsers = await storage.getUsers();
    // Filter out coordinator from leaderboard
    const participants = allUsers.filter(u => !u.is_coordinator);
    res.json(participants);
  });

  app.get(api.tools.list.path, async (req, res) => {
    const tools = await storage.getTools();
    res.json(tools);
  });

  app.get(api.tools.get.path, async (req, res) => {
    const tool = await storage.getTool(Number(req.params.id));
    if (!tool) return res.status(404).json({ message: "Tool not found" });
    res.json(tool);
  });

  app.post(api.tools.bid.path, requireAuth, async (req, res) => {
    try {
      const input = api.tools.bid.input.parse(req.body);
      const tool = await storage.getTool(Number(req.params.id));
      if (!tool) return res.status(404).json({ message: "Tool not found" });
      if (tool.status !== 'active') return res.status(400).json({ message: "Tool is not active" });
      if (input.amount <= tool.current_bid) return res.status(400).json({ message: "Bid too low" });

      const user = await storage.getUser(req.session.userId!);
      if (!user || user.credits < input.amount) return res.status(400).json({ message: "Not enough credits" });

      const updated = await storage.updateToolBid(tool.id, input.amount, user.id);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get(api.userTools.list.path, requireAuth, async (req, res) => {
    const allTools = await storage.getUserTools();
    const userTools = allTools.filter(t => t.user_id === req.session.userId);
    res.json(userTools);
  });

  app.post(api.userTools.place.path, requireAuth, async (req, res) => {
    try {
      const input = api.userTools.place.input.parse(req.body);
      const ut = await storage.getUserTool(Number(req.params.id));
      if (!ut) return res.status(404).json({ message: "Not found" });
      if (ut.user_id !== req.session.userId) return res.status(403).json({ message: "Forbidden" });

      const placed = await storage.placeUserTool(
        ut.id,
        input.layer,
      );

      res.status(200).json(placed);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get(api.game.state.path, async (req, res) => {
    const state = await storage.getGameState();
    res.json(state);
  });

  app.post("/api/user-tools/confirm", requireAuth, async (req, res) => {
    try {
      const input = api.game.confirmDefense.input.parse(req.body);
      const layout = input.layout;

      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const allUserTools = await storage.getUserTools();
      const userTools = allUserTools.filter(t => t.user_id === userId);

      // Apply all placements directly (no penalty logic)
      for (const ut of userTools) {
        const newLayer = layout[ut.id] ?? null;

        await storage.placeUserTool(
          ut.id,
          newLayer,
        );
      }

      res.json({ success: true });

    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post(api.game.advance.path, async (req, res) => {
    try {
      const input = api.game.advance.input.parse(req.body);
      const state = await storage.getGameState();

      let activeToolId = input.active_tool_id;
      
      // Handle legacy behavior or explicit clearing
      if (input.phase !== 'auction') {
        activeToolId = null;
      }

      const updated = await storage.updateGameState(input.phase, input.attack_strength || 0, activeToolId);
      res.json(updated);
    } catch(e:any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post(api.game.startAuction.path, async (req, res) => {
    try {
      const toolId = Number(req.params.toolId);
      const tool = await storage.getTool(toolId);
      if (!tool) return res.status(404).json({ message: "Tool not found" });

      const auctionEndAt = new Date(Date.now() + 3 * 60 * 1000);

      await storage.resetToolForAuction(toolId, auctionEndAt);

      const state = await storage.getGameState();
      const updated = await storage.updateGameState(
        state.phase,
        state.current_attack_strength || 0,
        toolId
      );

      res.json(updated);
    } catch(e:any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post(api.game.closeAuction.path, async (req, res) => {
    try {
      const state = await storage.getGameState();
      if (!state.active_tool_id) return res.status(400).json({ message: "No active auction" });
      
      const tool = await storage.getTool(state.active_tool_id);
      if (tool && tool.highest_bidder_id && tool.current_bid) {
        const user = await storage.getUser(tool.highest_bidder_id);
        if (user) {
          await storage.updateUser(user.id, user.credits - tool.current_bid, user.security_health, user.score);
          await storage.assignToolToUser(user.id, tool.id);
        }
        await storage.updateToolStatus(tool.id, 'sold');
      } else if (tool) {
        await storage.updateToolStatus(tool.id, 'unsold');
      }

      const updated = await storage.updateGameState(state.phase, state.current_attack_strength || 0, null);
      res.json(updated);
    } catch(e:any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post(api.game.runAttack.path, async (req, res) => {
    const state = await storage.getGameState();
    const attackStrength = state.current_attack_strength || 0;

    if (!state.phase.startsWith("attack")) {
      return res.status(400).json({ message: "Not in attack phase" });
    }

    const users = await storage.getUsers();
    const allUserTools = await storage.getUserTools();

    for (const user of users) {

      let remainingAttack = attackStrength;

      const userTools = allUserTools
        .filter(
          (t): t is typeof t & { layer: number } =>
            t.user_id === user.id && t.layer !== null
        )
        .sort((a, b) => a.layer - b.layer);

      for (let layer = 1; layer <= 3; layer++) {

        const layerTools = userTools.filter(t => t.layer === layer);

        const layerDefense = layerTools.reduce(
          (sum, t) => sum + t.current_strength,
          0
        );

        if (remainingAttack <= 0) break;

        if (remainingAttack >= layerDefense) {

          remainingAttack -= layerDefense;

          for (const tool of layerTools) {
            await storage.updateUserToolStrength(tool.id, 0);
          }

        } else {

          const damageRatio = remainingAttack / layerDefense;

          for (const tool of layerTools) {

            const newStrength = Math.max(
              0,
              Math.floor(
                tool.current_strength -
                tool.current_strength * damageRatio
              )
            );

            await storage.updateUserToolStrength(tool.id, newStrength);
          }

          remainingAttack = 0;
        }
      }

      const newHealth = Math.max(
        0,
        user.security_health - remainingAttack
      );

      const newScore = newHealth * 10 + user.credits;

      await storage.updateUser(
        user.id,
        user.credits,
        newHealth,
        newScore
      );
    }

    res.json({ message: "Attack executed with durability system" });
  });

  seedDatabase().catch(console.error);

  // Ensure coordinator exists with correct flag
  (async () => {
    const coord = await storage.getUserByUsername("coordinator");
    if (coord && !coord.is_coordinator) {
      await db.update(users).set({ is_coordinator: true }).where(eq(users.id, coord.id));
    } else if (!coord) {
      const newUser = await storage.createUser({
        username: "coordinator",
        password: "coordinator",
      });
      await db.update(users).set({ is_coordinator: true }).where(eq(users.id, newUser.id));
    }
  })().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const toolsList = await storage.getTools();
  if (toolsList.length === 0) {
    const defaultTools = [
      { name: "Firewall X", description: "Basic firewall protection. Blocks 20 attack strength.", strength: 20, base_price: 100 },
      { name: "Quantum Encryptor", description: "Advanced encryption layer. Blocks 50 attack strength.", strength: 50, base_price: 300 },
      { name: "AI Threat Detector", description: "Smart threat neutralization. Blocks 80 attack strength.", strength: 80, base_price: 500 },
      { name: "Basic Honeypot", description: "Decoys attackers away. Blocks 10 attack strength.", strength: 10, base_price: 50 },
      { name: "Zero-Day Patcher", description: "Immediate defense against unknown exploits. Blocks 100 attack strength.", strength: 100, base_price: 800 },
      { name: "Intrusion Prevention System", description: "Proactively identifies and blocks threats. Blocks 40 attack strength.", strength: 40, base_price: 250 },
      { name: "Deep Packet Inspector", description: "Analyzes traffic for hidden malware. Blocks 60 attack strength.", strength: 60, base_price: 400 },
      { name: "Neural Network Shield", description: "Self-learning defense grid. Blocks 90 attack strength.", strength: 90, base_price: 650 },
      { name: "DDoS Deflector", description: "Reduces impact of large-scale floods. Blocks 70 attack strength.", strength: 70, base_price: 450 },
      { name: "Secure Socket Proxy", description: "Encrypts all outgoing connections. Blocks 30 attack strength.", strength: 30, base_price: 150 }
    ];

    for (const tool of defaultTools) {
      await storage.createTool({
        ...tool,
        status: "pending",
        current_bid: tool.base_price,
      });
    }
  }
}
