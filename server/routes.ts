import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import {
  checkoutOrderSchema,
  createOrderSchema,
  insertProductSchema,
  insertUserSchema,
  orderStatuses,
  productStations,
  updateOrderItemStatusSchema,
  type OrderStatus,
  type ProductStation,
} from "@shared/schema";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { hashPassword } from "./utils";

const ensureAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Usuário não autenticado" });
};

const requireRoles = (roles: string[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Health check - rota pública
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api", (req, res, next) => {
    const publicPaths = ["/api/setup-admin", "/api/login", "/api/health"];
    const fullPath = `/api${req.path}`;
    if (publicPaths.includes(fullPath)) {
      return next();
    }
    ensureAuthenticated(req, res, next);
  });

  // Users
  app.get("/api/users", requireRoles(["admin"]), async (_req, res) => {
    const users = await storage.getUsers();
    const safeUsers = users.map(({ password: _password, ...rest }) => rest);
    res.json(safeUsers);
  });

  app.post("/api/admin/users", requireRoles(["admin"]), async (req, res) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Dados inválidos para criação de usuário",
        errors: result.error.flatten(),
      });
    }

    const existingUser = await storage.getUserByUsername(result.data.username);
    if (existingUser) {
      return res.status(400).json({ message: "Nome de usuário já existe" });
    }

    try {
      const hashedPassword = await hashPassword(result.data.password);
      const newUser = await storage.createUser({
        username: result.data.username,
        password: hashedPassword,
        role: result.data.role,
      });

      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      if (error instanceof Error && /duplicate key value/.test(error.message)) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  // Products
  app.get("/api/products", ensureAuthenticated, async (_req, res) => {
    const items = await storage.getProducts();
    res.json(items);
  });

  app.get("/api/products/:id", ensureAuthenticated, async (req, res) => {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const item = await storage.getProduct(productId);
    if (!item) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    res.json(item);
  });

  app.post("/api/products", requireRoles(["admin"]), async (req, res) => {
    const result = insertProductSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }

    const product = await storage.createProduct({
      ...result.data,
      createdBy: req.user!.id,
    });
    res.status(201).json(product);
  });

  app.patch("/api/products/:id", requireRoles(["admin"]), async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado" });
    }

    try {
      const updated = await storage.updateProduct(product.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao atualizar produto",
      });
    }
  });

  app.delete("/api/products/:id", requireRoles(["admin"]), async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.sendStatus(204);
  });

  app.post("/api/products/bulk-import", requireRoles(["admin"]), async (req, res) => {
    const payload: unknown[] = Array.isArray(req.body) ? req.body : [];
    const result = {
      success: [] as Array<{ product: string; id: number }>,
      errors: [] as Array<{ product: string; error: string }>,
    };

    for (const candidate of payload) {
      const parsed = insertProductSchema.safeParse(candidate);
      if (!parsed.success) {
        result.errors.push({
          product: typeof candidate === "object" && candidate && "name" in candidate ? String(candidate.name) : "desconhecido",
          error: "Dados inválidos",
        });
        continue;
      }

      try {
        const created = await storage.createProduct({
          ...parsed.data,
          createdBy: req.user!.id,
        });
        result.success.push({ product: created.name, id: created.id });
      } catch (error) {
        result.errors.push({
          product: parsed.data.name,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    res.json(result);
  });

  // Orders — waiter
  app.post("/api/orders", requireRoles(["waiter", "admin"]), async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados inválidos para criação do pedido",
        errors: parsed.error.flatten(),
      });
    }

    try {
      const order = await storage.createOrder(req.user!.id, parsed.data);
      res.status(201).json(order);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao criar pedido",
      });
    }
  });

  // Orders — station (kitchen / bar)
  app.get("/api/station/items", requireRoles(["kitchen", "bar"]), async (req, res) => {
    const role = req.user!.role;
    if (!productStations.includes(role as ProductStation)) {
      return res.status(400).json({ message: "Estação inválida" });
    }

    const queue = await storage.getStationQueue(role as ProductStation);
    res.json(queue);
  });

  app.patch("/api/order-items/:id/status", requireRoles(["kitchen", "bar", "waiter", "admin"]), async (req, res) => {
    const parsed = updateOrderItemStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Status inválido",
        errors: parsed.error.flatten(),
      });
    }

    try {
      const updated = await storage.updateOrderItemStatus(Number(req.params.id), parsed.data);
      res.json(updated);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao atualizar item",
      });
    }
  });

  // Orders — cashier/admin
  app.get("/api/orders", ensureAuthenticated, async (req, res) => {
    const statusParam = typeof req.query.status === "string" ? (req.query.status as string) : undefined;
    const status = statusParam && orderStatuses.includes(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : undefined;

    const effectiveStatus = status ?? "paid";
    const orders = await storage.getOrdersByStatus(effectiveStatus);
    res.json(orders);
  });

  app.get("/api/orders/open", requireRoles(["cashier", "admin"]), async (_req, res) => {
    const orders = await storage.getOrdersByStatus("open");
    res.json(orders);
  });

  app.post("/api/orders/:id/checkout", requireRoles(["cashier", "admin"]), async (req, res) => {
    const parsed = checkoutOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados inválidos para finalização",
        errors: parsed.error.flatten(),
      });
    }

    try {
      const order = await storage.checkoutOrder(Number(req.params.id), req.user!.id, parsed.data);
      res.json(order);
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao finalizar pedido",
      });
    }
  });

  app.patch("/api/orders/:id/cancel", requireRoles(["admin"]), async (req, res) => {
    try {
      const order = await storage.cancelOrder(Number(req.params.id));
      res.json(order);
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao cancelar pedido",
      });
    }
  });

  // Stats & stock
  app.get("/api/stats", ensureAuthenticated, async (_req, res) => {
    const stats = await storage.getSalesStats();
    res.json(stats);
  });

  app.get("/api/low-stock", ensureAuthenticated, async (_req, res) => {
    const items = await storage.getLowStockProducts();
    res.json(items);
  });

  const httpServer = createServer(app);
  return httpServer;
}
