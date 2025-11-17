import type { Express } from "express";
import request from "supertest";
import { setupDefaultUsers } from "../setup-default-users";
import { setupTestServer } from "./utils";

describe("Public route accessibility", () => {
  let app: Express.Application;
  let server: Awaited<ReturnType<typeof setupTestServer>>["server"];

  beforeAll(async () => {
    await setupDefaultUsers();
    const created = await setupTestServer();
    app = created.app;
    server = created.server;
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

  it("allows POST /api/login without prior authentication", async () => {
    await request(app)
      .post("/api/login")
      .send({ username: "admin", password: "admin123" })
      .expect(200);
  });

  it("does not block POST /api/setup-admin behind authentication middleware", async () => {
    const response = await request(app)
      .post("/api/setup-admin")
      .send({});

    expect(response.status).not.toBe(401);
  });
});
