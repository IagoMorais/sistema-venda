import type { Express } from "express";
import request from "supertest";
import { setupDefaultUsers } from "../setup-default-users";
import { setupTestServer } from "./utils";
import { db } from "../db";
import { products, users } from "@shared/schema";
import { eq } from "drizzle-orm";

describe("Admin protected flows", () => {
  let app: Express.Application;
  let server: Awaited<ReturnType<typeof setupTestServer>>["server"];
  let agent: request.SuperAgentTest;

  beforeAll(async () => {
    await setupDefaultUsers();
    const created = await setupTestServer();
    app = created.app;
    server = created.server;
    agent = request.agent(app);
    await agent
      .post("/api/login")
      .send({ username: "admin", password: "admin123" })
      .expect(200);
  });

  afterAll(async () => {
    if (server.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error?: Error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  });

  it("creates products with sanitized numeric values", async () => {
    const payload = {
      name: "Cafe Especial ",
      brand: " Fazenda Solar",
      price: "12,50",
      quantity: "5",
      minStockLevel: "2",
      discount: "",
      station: "bar",
    };

    const response = await agent.post("/api/products").send(payload);
    try {
      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Cafe Especial");
      expect(response.body.brand).toBe("Fazenda Solar");
      expect(response.body.price).toBe("12.50");
      expect(response.body.quantity).toBe(5);
      expect(response.body.minStockLevel).toBe(2);
    } finally {
      if (response.body?.id) {
        await db.delete(products).where(eq(products.id, response.body.id));
      }
    }
  });

  it("rejects product creation with non numeric price", async () => {
    const payload = {
      name: "Agua",
      brand: "Purificada",
      price: "abc",
      quantity: 1,
      minStockLevel: 1,
      station: "kitchen",
    };

    const response = await agent.post("/api/products").send(payload);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("issues");
  });

  it("rejects product creation with negative quantity", async () => {
    const payload = {
      name: "Suco",
      brand: "Natural",
      price: 5,
      quantity: -2,
      minStockLevel: 1,
      station: "bar",
    };

    const response = await agent.post("/api/products").send(payload);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("issues");
  });

  it("handles concurrent user creation attempts gracefully", async () => {
    const username = `user_${Date.now()}`;
    const payload = {
      username,
      password: "senha123",
      confirmPassword: "senha123",
      role: "waiter",
    };

    const [first, second] = await Promise.all([
      agent.post("/api/admin/users").send(payload),
      agent.post("/api/admin/users").send(payload),
    ]);

    try {
      const statuses = [first.status, second.status].sort();
      expect(statuses).toStrictEqual([201, 400]);
    } finally {
      await db.delete(users).where(eq(users.username, username));
    }
  });
});
