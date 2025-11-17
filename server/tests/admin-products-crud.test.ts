import type { Express } from "express";
import request from "supertest";
import { setupDefaultUsers } from "../setup-default-users";
import { setupTestServer } from "./utils";
import { db } from "../db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

describe("Admin product CRUD", () => {
  let app: Express.Application;
  let server: Awaited<ReturnType<typeof setupTestServer>>["server"];
  let agent: request.SuperAgentTest;
  let createdProductId: number | null = null;

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
    if (createdProductId) {
      await db.delete(products).where(eq(products.id, createdProductId));
    }

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

  it("creates a product via POST /api/products", async () => {
    const payload = {
      name: "Produto Teste CRUD",
      brand: "Marca Teste",
      price: 10,
      quantity: 5,
      minStockLevel: 2,
      station: "kitchen",
    };

    const response = await agent.post("/api/products").send(payload).expect(201);

    expect(response.body).toMatchObject({
      name: payload.name,
      brand: payload.brand.trim(),
      station: payload.station,
    });
    expect(Number(response.body.price)).toBeCloseTo(10);
    expect(response.body.quantity).toBe(5);

    createdProductId = response.body.id;
  });

  it("deletes the product via DELETE /api/products/:id", async () => {
    if (!createdProductId) {
      throw new Error("Product was not created in previous step");
    }

    await agent.delete(`/api/products/${createdProductId}`).expect(204);
  });

  it("returns 404 when fetching a deleted product", async () => {
    if (!createdProductId) {
      throw new Error("Product was not created in previous step");
    }

    await agent.get(`/api/products/${createdProductId}`).expect(404);
    createdProductId = null;
  });

  it("updates stock via PATCH /api/products/:id and rejects invalid data", async () => {
    const createResponse = await agent.post("/api/products").send({
      name: "Produto Estoque",
      brand: "Marca Estoque",
      price: 20,
      quantity: 3,
      minStockLevel: 1,
      station: "bar",
    }).expect(201);

    const productId: number = createResponse.body.id;
    const currentStock: number = createResponse.body.quantity;

    try {
      const increaseResponse = await agent
        .patch(`/api/products/${productId}`)
        .send({ quantity: currentStock + 7 })
        .expect(200);

      expect(increaseResponse.body.quantity).toBe(currentStock + 7);

      await agent
        .patch(`/api/products/${productId}`)
        .send({ quantity: -5 })
        .expect(400);
    } finally {
      await db.delete(products).where(eq(products.id, productId));
    }
  });
});
