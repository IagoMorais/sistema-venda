var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  checkoutOrderSchema: () => checkoutOrderSchema,
  createOrderSchema: () => createOrderSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertProductSchema: () => insertProductSchema,
  insertUserSchema: () => insertUserSchema,
  orderItemStatuses: () => orderItemStatuses,
  orderItems: () => orderItems,
  orderStatuses: () => orderStatuses,
  orders: () => orders,
  paymentMethods: () => paymentMethods,
  productStations: () => productStations,
  products: () => products,
  updateOrderItemStatusSchema: () => updateOrderItemStatusSchema,
  userRoles: () => userRoles,
  users: () => users
});
import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var toNumber, userRoles, productStations, orderStatuses, orderItemStatuses, paymentMethods, users, products, orders, orderItems, insertUserSchema, insertProductSchema, insertOrderSchema, insertOrderItemSchema, createOrderSchema, updateOrderItemStatusSchema, checkoutOrderSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    toNumber = (value, ctx, options2) => {
      if (typeof value === "number") {
        if (!Number.isFinite(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${options2.field} inv\xE1lido`
          });
          return z.NEVER;
        }
        if (options2.min !== void 0 && value < options2.min) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${options2.field} deve ser maior ou igual a ${options2.min}`
          });
          return z.NEVER;
        }
        if (options2.integer && !Number.isInteger(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${options2.field} deve ser um n\xFAmero inteiro`
          });
          return z.NEVER;
        }
        return value;
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
          if (options2.allowEmpty && options2.defaultValue !== void 0) {
            return options2.defaultValue;
          }
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${options2.field} \xE9 obrigat\xF3rio`
          });
          return z.NEVER;
        }
        const normalized = trimmed.replace(",", ".");
        const parsed = Number(normalized);
        if (!Number.isFinite(parsed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${options2.field} inv\xE1lido`
          });
          return z.NEVER;
        }
        if (options2.min !== void 0 && parsed < options2.min) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${options2.field} deve ser maior ou igual a ${options2.min}`
          });
          return z.NEVER;
        }
        if (options2.integer && !Number.isInteger(parsed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${options2.field} deve ser um n\xFAmero inteiro`
          });
          return z.NEVER;
        }
        return parsed;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${options2.field} inv\xE1lido`
      });
      return z.NEVER;
    };
    userRoles = ["admin", "waiter", "cashier", "kitchen", "bar"];
    productStations = ["kitchen", "bar"];
    orderStatuses = ["open", "paid", "cancelled"];
    orderItemStatuses = ["pending", "preparing", "ready", "delivered"];
    paymentMethods = ["cash", "credit", "debit", "pix"];
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      username: text("username").notNull().unique(),
      password: text("password").notNull(),
      role: text("role", { enum: userRoles }).notNull().default("waiter"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    products = pgTable("products", {
      id: serial("id").primaryKey(),
      name: text("name").notNull(),
      brand: text("brand").notNull(),
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      quantity: integer("quantity").notNull(),
      minStockLevel: integer("min_stock_level").notNull(),
      imageUrl: text("imageurl"),
      discount: decimal("discount", { precision: 5, scale: 2 }).default("0").notNull(),
      createdBy: integer("created_by").references(() => users.id),
      station: text("station", { enum: productStations }).notNull().default("kitchen")
    });
    orders = pgTable("orders", {
      id: serial("id").primaryKey(),
      tableNumber: text("table_number").notNull(),
      status: text("status", { enum: orderStatuses }).notNull().default("open"),
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
      paymentMethod: text("payment_method", { enum: paymentMethods }),
      waiterId: integer("waiter_id").references(() => users.id),
      cashierId: integer("cashier_id").references(() => users.id),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      closedAt: timestamp("closed_at")
    });
    orderItems = pgTable("order_items", {
      id: serial("id").primaryKey(),
      orderId: integer("order_id").notNull().references(() => orders.id),
      productId: integer("product_id").notNull().references(() => products.id),
      quantity: integer("quantity").notNull(),
      priceAtTime: decimal("price_at_time", { precision: 10, scale: 2 }).notNull(),
      station: text("station", { enum: productStations }).notNull(),
      status: text("status", { enum: orderItemStatuses }).notNull().default("pending"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertUserSchema = z.object({
      username: z.string().trim().min(3, "Username must be at least 3 characters"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z.string(),
      role: z.enum(userRoles).default("waiter")
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"]
    });
    insertProductSchema = createInsertSchema(products).omit({
      id: true,
      createdBy: true
    }).extend({
      name: z.string().trim().min(1, "Nome \xE9 obrigat\xF3rio"),
      brand: z.string().trim().min(1, "Marca \xE9 obrigat\xF3ria"),
      price: z.union([z.string(), z.number()]).transform(
        (val, ctx) => toNumber(val, ctx, { field: "Pre\xE7o", min: 0 })
      ),
      quantity: z.union([z.string(), z.number()]).transform(
        (val, ctx) => toNumber(val, ctx, { field: "Quantidade", min: 0, integer: true })
      ),
      minStockLevel: z.union([z.string(), z.number()]).transform(
        (val, ctx) => toNumber(val, ctx, { field: "Estoque m\xEDnimo", min: 0, integer: true })
      ),
      discount: z.union([z.string(), z.number(), z.undefined()]).transform((val, ctx) => {
        if (val === void 0) {
          return 0;
        }
        return toNumber(val, ctx, {
          field: "Desconto",
          min: 0,
          allowEmpty: true,
          defaultValue: 0
        });
      }),
      imageUrl: z.string().trim().min(1, "URL da imagem inv\xE1lida").optional(),
      station: z.enum(productStations).default("kitchen")
    });
    insertOrderSchema = createInsertSchema(orders).omit({
      id: true,
      createdAt: true
    }).extend({
      totalAmount: z.string().or(z.number()).transform(
        (val) => typeof val === "string" ? parseFloat(val) : val
      ).optional(),
      status: z.enum(orderStatuses).default("open"),
      paymentMethod: z.enum(paymentMethods).optional()
    });
    insertOrderItemSchema = createInsertSchema(orderItems).omit({
      id: true,
      createdAt: true
    }).extend({
      priceAtTime: z.string().or(z.number()).transform(
        (val) => typeof val === "string" ? parseFloat(val) : val
      ),
      station: z.enum(productStations),
      status: z.enum(orderItemStatuses).default("pending")
    });
    createOrderSchema = z.object({
      tableNumber: z.string().min(1, "O n\xFAmero da mesa \xE9 obrigat\xF3rio"),
      items: z.array(z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive()
      })).min(1)
    });
    updateOrderItemStatusSchema = z.object({
      status: z.enum(orderItemStatuses)
    });
    checkoutOrderSchema = z.object({
      paymentMethod: z.enum(paymentMethods),
      totalAmount: z.string().or(z.number()).transform(
        (val) => typeof val === "string" ? parseFloat(val) : val
      )
    });
  }
});

// server/db.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var Pool, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    ({ Pool } = pg);
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    db = drizzle(pool, { schema: schema_exports });
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  DatabaseStorage: () => DatabaseStorage,
  storage: () => storage
});
import session from "express-session";
import connectPg from "connect-pg-simple";
import { and, eq, inArray, lte } from "drizzle-orm";
var PostgresSessionStore, toDecimalString, ensureValidStation, ensureValidPayment, normalizeNumberInput, ensureNonNegative, ensureInteger, mapOrderRows, DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    PostgresSessionStore = connectPg(session);
    toDecimalString = (value) => {
      if (!Number.isFinite(value)) {
        throw new Error("Valor num\xE9rico inv\xE1lido");
      }
      return value.toFixed(2);
    };
    ensureValidStation = (station) => productStations.includes(station);
    ensureValidPayment = (payment) => paymentMethods.includes(payment);
    normalizeNumberInput = (input, field) => {
      if (typeof input === "number") {
        if (!Number.isFinite(input)) {
          throw new Error(`${field} inv\xE1lido`);
        }
        return input;
      }
      if (typeof input === "string") {
        const trimmed = input.trim();
        if (!trimmed) {
          throw new Error(`${field} \xE9 obrigat\xF3rio`);
        }
        const normalized = trimmed.replace(",", ".");
        const parsed = Number(normalized);
        if (!Number.isFinite(parsed)) {
          throw new Error(`${field} inv\xE1lido`);
        }
        return parsed;
      }
      throw new Error(`${field} inv\xE1lido`);
    };
    ensureNonNegative = (value, field) => {
      if (value < 0) {
        throw new Error(`${field} deve ser maior ou igual a zero`);
      }
      return value;
    };
    ensureInteger = (value, field) => {
      if (!Number.isInteger(value)) {
        throw new Error(`${field} deve ser um n\xFAmero inteiro`);
      }
      return value;
    };
    mapOrderRows = (rows) => {
      const map = /* @__PURE__ */ new Map();
      for (const row of rows) {
        const baseOrder = map.get(row.order.id);
        if (!baseOrder) {
          map.set(row.order.id, {
            ...row.order,
            items: []
          });
        }
        if (row.item && row.product) {
          map.get(row.order.id).items.push({
            ...row.item,
            product: {
              name: row.product.name,
              brand: row.product.brand,
              station: row.product.station
            }
          });
        }
      }
      return Array.from(map.values());
    };
    DatabaseStorage = class {
      constructor() {
        this.sessionStore = new PostgresSessionStore({
          pool,
          createTableIfMissing: true
        });
      }
      async getUser(id) {
        const [userRecord] = await db.select().from(users).where(eq(users.id, id));
        if (!userRecord) {
          throw new Error("User not found");
        }
        return userRecord;
      }
      async getUserByUsername(username) {
        const normalizedUsername = username.trim();
        const [userRecord] = await db.select().from(users).where(eq(users.username, normalizedUsername));
        return userRecord;
      }
      async createUser(user) {
        const username = user.username.trim();
        if (!username) {
          throw new Error("Nome de usu\xE1rio inv\xE1lido");
        }
        const [newUser] = await db.insert(users).values({
          ...user,
          username
        }).returning();
        return newUser;
      }
      async getUsers() {
        return db.select().from(users);
      }
      async getProducts() {
        return db.select().from(products);
      }
      async getProduct(id) {
        const [productRecord] = await db.select().from(products).where(eq(products.id, id));
        return productRecord;
      }
      async createProduct(product) {
        const price = ensureNonNegative(normalizeNumberInput(product.price, "Pre\xE7o"), "Pre\xE7o");
        const discount = ensureNonNegative(
          normalizeNumberInput(product.discount ?? 0, "Desconto"),
          "Desconto"
        );
        const quantity = ensureInteger(
          ensureNonNegative(normalizeNumberInput(product.quantity, "Quantidade"), "Quantidade"),
          "Quantidade"
        );
        const minStockLevel = ensureInteger(
          ensureNonNegative(
            normalizeNumberInput(product.minStockLevel, "Estoque m\xEDnimo"),
            "Estoque m\xEDnimo"
          ),
          "Estoque m\xEDnimo"
        );
        if (!ensureValidStation(product.station)) {
          throw new Error("Invalid station provided");
        }
        const insertValues = {
          name: product.name.trim(),
          brand: product.brand.trim(),
          price: toDecimalString(price),
          discount: toDecimalString(discount),
          quantity,
          minStockLevel,
          station: product.station,
          createdBy: product.createdBy
        };
        if (product.imageUrl !== void 0) {
          const trimmedImageUrl = product.imageUrl.trim();
          insertValues.imageUrl = trimmedImageUrl === "" ? null : trimmedImageUrl;
        }
        const [newProduct] = await db.insert(products).values(insertValues).returning();
        return newProduct;
      }
      async updateProduct(id, updates) {
        const formattedUpdates = { ...updates };
        if (updates.price !== void 0) {
          const parsedPrice = ensureNonNegative(
            normalizeNumberInput(updates.price, "Pre\xE7o"),
            "Pre\xE7o"
          );
          formattedUpdates.price = toDecimalString(parsedPrice);
        }
        if (updates.discount !== void 0) {
          const parsedDiscount = ensureNonNegative(
            normalizeNumberInput(updates.discount, "Desconto"),
            "Desconto"
          );
          formattedUpdates.discount = toDecimalString(parsedDiscount);
        }
        if (updates.quantity !== void 0) {
          const parsedQuantity = ensureInteger(
            ensureNonNegative(normalizeNumberInput(updates.quantity, "Quantidade"), "Quantidade"),
            "Quantidade"
          );
          formattedUpdates.quantity = parsedQuantity;
        }
        if (updates.minStockLevel !== void 0) {
          const parsedMinStock = ensureInteger(
            ensureNonNegative(
              normalizeNumberInput(updates.minStockLevel, "Estoque m\xEDnimo"),
              "Estoque m\xEDnimo"
            ),
            "Estoque m\xEDnimo"
          );
          formattedUpdates.minStockLevel = parsedMinStock;
        }
        if (updates.name !== void 0) {
          formattedUpdates.name = updates.name.trim();
        }
        if (updates.brand !== void 0) {
          formattedUpdates.brand = updates.brand.trim();
        }
        if (updates.imageUrl !== void 0) {
          formattedUpdates.imageUrl = updates.imageUrl?.trim() || null;
        }
        if (updates.station && !ensureValidStation(updates.station)) {
          throw new Error("Invalid station provided");
        }
        const [updatedProduct] = await db.update(products).set(formattedUpdates).where(eq(products.id, id)).returning();
        if (!updatedProduct) {
          throw new Error("Product not found");
        }
        return updatedProduct;
      }
      async deleteProduct(id) {
        await db.delete(products).where(eq(products.id, id));
      }
      async getLowStockProducts() {
        return db.select().from(products).where(lte(products.quantity, products.minStockLevel));
      }
      async createOrder(waiterId, payload) {
        return db.transaction(async (tx) => {
          const productIds = payload.items.map((item) => item.productId);
          const productRecords = await tx.select().from(products).where(inArray(products.id, productIds));
          const productsById = new Map(productRecords.map((product) => [product.id, product]));
          const requiredQuantities = /* @__PURE__ */ new Map();
          for (const item of payload.items) {
            requiredQuantities.set(
              item.productId,
              (requiredQuantities.get(item.productId) ?? 0) + item.quantity
            );
          }
          for (const [productId, required] of requiredQuantities.entries()) {
            const product = productsById.get(productId);
            if (!product) {
              throw new Error(`Produto ${productId} n\xE3o encontrado`);
            }
            if (product.quantity < required) {
              throw new Error(`Estoque insuficiente para ${product.name}`);
            }
          }
          const [orderRecord] = await tx.insert(orders).values({
            tableNumber: payload.tableNumber,
            waiterId,
            status: "open",
            totalAmount: "0"
          }).returning();
          if (!orderRecord) {
            throw new Error("N\xE3o foi poss\xEDvel criar o pedido");
          }
          let runningTotal = 0;
          const createdItems = [];
          for (const item of payload.items) {
            const product = { ...productsById.get(item.productId) };
            const numericPrice = Number(product.price);
            runningTotal += numericPrice * item.quantity;
            await tx.update(products).set({ quantity: product.quantity - item.quantity }).where(eq(products.id, product.id));
            productsById.set(product.id, {
              ...product,
              quantity: product.quantity - item.quantity
            });
            const [orderItemRecord] = await tx.insert(orderItems).values({
              orderId: orderRecord.id,
              productId: product.id,
              quantity: item.quantity,
              priceAtTime: toDecimalString(numericPrice),
              station: product.station,
              status: "pending"
            }).returning();
            createdItems.push({
              ...orderItemRecord,
              product: {
                name: product.name,
                brand: product.brand,
                station: product.station
              }
            });
          }
          const totalAsString = toDecimalString(runningTotal);
          const [updatedOrder] = await tx.update(orders).set({ totalAmount: totalAsString }).where(eq(orders.id, orderRecord.id)).returning();
          return {
            ...updatedOrder ?? { ...orderRecord, totalAmount: totalAsString },
            items: createdItems
          };
        });
      }
      async getOrderWithItems(orderId) {
        const rows = await db.select({
          order: orders,
          item: orderItems,
          product: products
        }).from(orders).leftJoin(orderItems, eq(orderItems.orderId, orders.id)).leftJoin(products, eq(orderItems.productId, products.id)).where(eq(orders.id, orderId));
        if (rows.length === 0) {
          return void 0;
        }
        return mapOrderRows(rows)[0];
      }
      async getStationQueue(station) {
        const rows = await db.select({
          order: orders,
          item: orderItems,
          product: products
        }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).innerJoin(products, eq(orderItems.productId, products.id)).where(and(eq(orderItems.station, station), eq(orderItems.status, "pending")));
        return mapOrderRows(rows);
      }
      async updateOrderItemStatus(orderItemId, input) {
        if (!orderItemStatuses.includes(input.status)) {
          throw new Error("Status inv\xE1lido para item do pedido");
        }
        const [updated] = await db.update(orderItems).set({ status: input.status }).where(eq(orderItems.id, orderItemId)).returning();
        if (!updated) {
          throw new Error("Item do pedido n\xE3o encontrado");
        }
        return updated;
      }
      async getOrdersByStatus(status) {
        const rows = await db.select({
          order: orders,
          item: orderItems,
          product: products
        }).from(orders).leftJoin(orderItems, eq(orderItems.orderId, orders.id)).leftJoin(products, eq(orderItems.productId, products.id)).where(eq(orders.status, status));
        return mapOrderRows(rows);
      }
      async checkoutOrder(orderId, cashierId, input) {
        if (!ensureValidPayment(input.paymentMethod)) {
          throw new Error("Forma de pagamento inv\xE1lida");
        }
        return db.transaction(async (tx) => {
          const order = await this.getOrderWithItems(orderId);
          if (!order) {
            throw new Error("Pedido n\xE3o encontrado");
          }
          if (order.status !== "open") {
            throw new Error("Pedido n\xE3o est\xE1 aberto para finaliza\xE7\xE3o");
          }
          const hasPendingItems = order.items.some(
            (item) => item.status !== "ready" && item.status !== "delivered"
          );
          if (hasPendingItems) {
            throw new Error("Todos os itens precisam estar prontos antes de finalizar");
          }
          const computedTotal = order.items.reduce(
            (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
            0
          );
          const amountFromInput = Number(input.totalAmount);
          const totalToPersist = toDecimalString(
            Number.isFinite(amountFromInput) ? amountFromInput : computedTotal
          );
          const [updatedOrder] = await tx.update(orders).set({
            status: "paid",
            cashierId,
            paymentMethod: input.paymentMethod,
            totalAmount: totalToPersist,
            closedAt: /* @__PURE__ */ new Date()
          }).where(eq(orders.id, orderId)).returning();
          if (!updatedOrder) {
            throw new Error("Falha ao finalizar pedido");
          }
          return {
            ...updatedOrder,
            items: order.items
          };
        });
      }
      async cancelOrder(orderId) {
        return db.transaction(async (tx) => {
          const order = await this.getOrderWithItems(orderId);
          if (!order) {
            throw new Error("Pedido n\xE3o encontrado");
          }
          if (order.status === "cancelled") {
            return order;
          }
          for (const item of order.items) {
            const [productRecord] = await tx.select().from(products).where(eq(products.id, item.productId));
            if (productRecord) {
              await tx.update(products).set({ quantity: productRecord.quantity + item.quantity }).where(eq(products.id, item.productId));
            }
          }
          const [updatedOrder] = await tx.update(orders).set({
            status: "cancelled",
            closedAt: /* @__PURE__ */ new Date()
          }).where(eq(orders.id, orderId)).returning();
          if (!updatedOrder) {
            throw new Error("Falha ao cancelar pedido");
          }
          return {
            ...updatedOrder,
            items: order.items
          };
        });
      }
      async getSalesStats() {
        const paidOrders = await db.select().from(orders).where(eq(orders.status, "paid"));
        const totalRevenue = paidOrders.reduce(
          (sum, order) => sum + Number(order.totalAmount ?? 0),
          0
        );
        const totalsByProduct = await db.select({
          productId: orderItems.productId,
          quantity: orderItems.quantity
        }).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(eq(orders.status, "paid"));
        const productSales = totalsByProduct.reduce((acc, row) => {
          acc[row.productId] = (acc[row.productId] ?? 0) + row.quantity;
          return acc;
        }, {});
        const topProducts = Object.entries(productSales).map(([productId, quantity]) => ({
          productId: Number(productId),
          quantity
        })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
        return {
          totalSales: paidOrders.length,
          totalRevenue,
          topProducts
        };
      }
    };
    storage = new DatabaseStorage();
  }
});

// server/utils.ts
var utils_exports = {};
__export(utils_exports, {
  comparePasswords: () => comparePasswords,
  hashPassword: () => hashPassword
});
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Formato de senha inv\xE1lido");
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    if (hashedBuf.length !== suppliedBuf.length) {
      console.error("Comprimento do buffer de senha incompat\xEDvel");
      return false;
    }
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Erro ao comparar senhas:", error);
    return false;
  }
}
var scryptAsync;
var init_utils = __esm({
  "server/utils.ts"() {
    "use strict";
    scryptAsync = promisify(scrypt);
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path2 from "path";

// server/routes.ts
init_schema();
init_storage();
import { createServer } from "http";

// server/auth.ts
init_storage();
init_utils();
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
function setupAuth(app2) {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET must be defined before initializing authentication");
  }
  const sessionSettings = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1e3 * 60 * 60 * 24 * 7
      // 1 semana
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !await comparePasswords(password, user.password)) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Credenciais inv\xE1lidas" });
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        console.log("Login bem-sucedido:", user.username, user.role);
        const { password: _password, ...safeUser } = user;
        return res.status(200).json(safeUser);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password: _password, ...safeUser } = req.user;
    res.json(safeUser);
  });
  app2.use(["/api/products/*/delete", "/api/products/create", "/api/admin/*"], (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usu\xE1rio n\xE3o autenticado" });
    }
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado: apenas administradores" });
    }
    next();
  });
}

// server/routes.ts
init_utils();
var ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Usu\xE1rio n\xE3o autenticado" });
};
var requireRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usu\xE1rio n\xE3o autenticado" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    next();
  };
};
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.use("/api", (req, res, next) => {
    const publicPaths = ["/api/setup-admin", "/api/login", "/api/health"];
    const fullPath = `/api${req.path}`;
    if (publicPaths.includes(fullPath)) {
      return next();
    }
    ensureAuthenticated(req, res, next);
  });
  app2.get("/api/users", requireRoles(["admin"]), async (_req, res) => {
    const users2 = await storage.getUsers();
    const safeUsers = users2.map(({ password: _password, ...rest }) => rest);
    res.json(safeUsers);
  });
  app2.post("/api/admin/users", requireRoles(["admin"]), async (req, res) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Dados inv\xE1lidos para cria\xE7\xE3o de usu\xE1rio",
        errors: result.error.flatten()
      });
    }
    const existingUser = await storage.getUserByUsername(result.data.username);
    if (existingUser) {
      return res.status(400).json({ message: "Nome de usu\xE1rio j\xE1 existe" });
    }
    try {
      const hashedPassword = await hashPassword(result.data.password);
      const newUser = await storage.createUser({
        username: result.data.username,
        password: hashedPassword,
        role: result.data.role
      });
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Erro ao criar usu\xE1rio:", error);
      if (error instanceof Error && /duplicate key value/.test(error.message)) {
        return res.status(400).json({ message: "Nome de usu\xE1rio j\xE1 existe" });
      }
      res.status(500).json({ message: "Erro ao criar usu\xE1rio" });
    }
  });
  app2.get("/api/products", ensureAuthenticated, async (_req, res) => {
    const items = await storage.getProducts();
    res.json(items);
  });
  app2.get("/api/products/:id", ensureAuthenticated, async (req, res) => {
    const productId = Number(req.params.id);
    if (Number.isNaN(productId)) {
      return res.status(400).json({ message: "ID inv\xE1lido" });
    }
    const item = await storage.getProduct(productId);
    if (!item) {
      return res.status(404).json({ message: "Produto n\xE3o encontrado" });
    }
    res.json(item);
  });
  app2.post("/api/products", requireRoles(["admin"]), async (req, res) => {
    const result = insertProductSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }
    const product = await storage.createProduct({
      ...result.data,
      createdBy: req.user.id
    });
    res.status(201).json(product);
  });
  app2.patch("/api/products/:id", requireRoles(["admin"]), async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: "Produto n\xE3o encontrado" });
    }
    try {
      const updated = await storage.updateProduct(product.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao atualizar produto"
      });
    }
  });
  app2.delete("/api/products/:id", requireRoles(["admin"]), async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.sendStatus(204);
  });
  app2.post("/api/products/bulk-import", requireRoles(["admin"]), async (req, res) => {
    const payload = Array.isArray(req.body) ? req.body : [];
    const result = {
      success: [],
      errors: []
    };
    for (const candidate of payload) {
      const parsed = insertProductSchema.safeParse(candidate);
      if (!parsed.success) {
        result.errors.push({
          product: typeof candidate === "object" && candidate && "name" in candidate ? String(candidate.name) : "desconhecido",
          error: "Dados inv\xE1lidos"
        });
        continue;
      }
      try {
        const created = await storage.createProduct({
          ...parsed.data,
          createdBy: req.user.id
        });
        result.success.push({ product: created.name, id: created.id });
      } catch (error) {
        result.errors.push({
          product: parsed.data.name,
          error: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }
    res.json(result);
  });
  app2.post("/api/orders", requireRoles(["waiter", "admin"]), async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados inv\xE1lidos para cria\xE7\xE3o do pedido",
        errors: parsed.error.flatten()
      });
    }
    try {
      const order = await storage.createOrder(req.user.id, parsed.data);
      res.status(201).json(order);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao criar pedido"
      });
    }
  });
  app2.get("/api/station/items", requireRoles(["kitchen", "bar"]), async (req, res) => {
    const role = req.user.role;
    if (!productStations.includes(role)) {
      return res.status(400).json({ message: "Esta\xE7\xE3o inv\xE1lida" });
    }
    const queue = await storage.getStationQueue(role);
    res.json(queue);
  });
  app2.patch("/api/order-items/:id/status", requireRoles(["kitchen", "bar", "waiter", "admin"]), async (req, res) => {
    const parsed = updateOrderItemStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Status inv\xE1lido",
        errors: parsed.error.flatten()
      });
    }
    try {
      const updated = await storage.updateOrderItemStatus(Number(req.params.id), parsed.data);
      res.json(updated);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao atualizar item"
      });
    }
  });
  app2.get("/api/orders", ensureAuthenticated, async (req, res) => {
    const statusParam = typeof req.query.status === "string" ? req.query.status : void 0;
    const status = statusParam && orderStatuses.includes(statusParam) ? statusParam : void 0;
    const effectiveStatus = status ?? "paid";
    const orders2 = await storage.getOrdersByStatus(effectiveStatus);
    res.json(orders2);
  });
  app2.get("/api/orders/open", requireRoles(["cashier", "admin"]), async (_req, res) => {
    const orders2 = await storage.getOrdersByStatus("open");
    res.json(orders2);
  });
  app2.post("/api/orders/:id/checkout", requireRoles(["cashier", "admin"]), async (req, res) => {
    const parsed = checkoutOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados inv\xE1lidos para finaliza\xE7\xE3o",
        errors: parsed.error.flatten()
      });
    }
    try {
      const order = await storage.checkoutOrder(Number(req.params.id), req.user.id, parsed.data);
      res.json(order);
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao finalizar pedido"
      });
    }
  });
  app2.patch("/api/orders/:id/cancel", requireRoles(["admin"]), async (req, res) => {
    try {
      const order = await storage.cancelOrder(Number(req.params.id));
      res.json(order);
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Erro ao cancelar pedido"
      });
    }
  });
  app2.get("/api/stats", ensureAuthenticated, async (_req, res) => {
    const stats = await storage.getSalesStats();
    res.json(stats);
  });
  app2.get("/api/low-stock", ensureAuthenticated, async (_req, res) => {
    const items = await storage.getLowStockProducts();
    res.json(items);
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
var __filename = fileURLToPath(import.meta.url);
var __dirname2 = dirname(__filename);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    configFile: path.resolve(__dirname2, "..", "vite.config.ts"),
    server: serverOptions,
    appType: "custom"
  });
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api-docs") || req.path === "/api-docs.json") {
      return next();
    }
    vite.middlewares(req, res, next);
  });
  app2.use("*", async (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/api-docs")) {
      return next();
    }
    try {
      const clientTemplate = path.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      console.error("Erro ao servir index.html:", e);
      res.status(500).send("Erro ao carregar a aplica\xE7\xE3o");
    }
  });
}
function serveStatic(app2) {
  const distPath = path.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// server/setup-default-users.ts
init_storage();
init_utils();
async function setupDefaultUsers() {
  try {
    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME?.trim() || "admin";
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
    const defaultUsers = [
      { username: adminUsername, password: adminPassword, role: "admin" },
      { username: "waiter", password: "waiter123", role: "waiter" },
      { username: "cashier", password: "cashier123", role: "cashier" },
      { username: "kitchen", password: "kitchen123", role: "kitchen" },
      { username: "bar", password: "bar123", role: "bar" }
    ];
    for (const userTemplate of defaultUsers) {
      try {
        const exists = await storage.getUserByUsername(userTemplate.username);
        if (!exists) {
          const hashedPassword = await hashPassword(userTemplate.password);
          await storage.createUser({
            username: userTemplate.username,
            password: hashedPassword,
            role: userTemplate.role
          });
          console.log(`Usu\xE1rio ${userTemplate.username} (${userTemplate.role}) criado com sucesso`);
        }
      } catch (error) {
        const errorWithCode = error;
        if (errorWithCode.code === "23505") {
          console.warn(`Usu\xE1rio ${userTemplate.username} j\xE1 existe (detec\xE7\xE3o concorrente).`);
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    console.error("Erro ao criar usu\xE1rios padr\xE3o:", error);
    throw error;
  }
}

// server/swagger.ts
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
var swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "API de Gerenciamento de Estoque",
    version: "1.0.0",
    description: "Documenta\xE7\xE3o da API para o sistema de gerenciamento de estoque"
  },
  servers: [
    {
      url: "/api",
      description: "Servidor de desenvolvimento"
    }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "connect.sid"
      }
    }
  },
  security: [
    {
      cookieAuth: []
    }
  ]
};
var options = {
  swaggerDefinition,
  apis: ["./server/routes.ts"]
};
var swaggerSpec = swaggerJSDoc(options);
function setupSwagger(app2) {
  app2.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app2.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
  console.log("Swagger UI dispon\xEDvel em /api-docs");
}

// server/index.ts
if (!process.env.SESSION_SECRET) {
  console.error("SESSION_SECRET must be defined before starting the server.");
  process.exit(1);
}
var app = express2();
app.use(helmet());
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const duration = Date.now() - start;
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.post("/api/setup-admin", async (req, res) => {
  try {
    log("Recebida requisi\xE7\xE3o para criar admin");
    express2.json()(req, res, async () => {
      const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const { hashPassword: hashPassword3 } = await Promise.resolve().then(() => (init_utils(), utils_exports));
      const existingAdmin = await storage2.getUserByUsername("admin");
      if (existingAdmin) {
        log("Admin j\xE1 existe");
        return res.status(400).send("Admin j\xE1 existe");
      }
      const hashedPassword = await hashPassword3("123456");
      const adminUser = await storage2.createUser({
        username: "admin",
        password: hashedPassword,
        role: "admin"
      });
      log("Admin criado com sucesso");
      res.status(201).json(adminUser);
    });
  } catch (error) {
    log("Erro ao criar admin: " + error);
    console.error("Erro ao criar admin:", error);
    res.status(500).send("Erro ao criar admin");
  }
});
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
(async () => {
  try {
    await setupDefaultUsers();
    setupSwagger(app);
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
      app.use("*", (req, res) => {
        if (req.path.startsWith("/api")) {
          return res.status(404).json({ message: "Rota API n\xE3o encontrada" });
        }
        const distPath = path2.resolve(__dirname, "public");
        res.sendFile(path2.resolve(distPath, "index.html"));
      });
    }
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Servidor rodando em 0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao inicializar servidor:", error);
    process.exit(1);
  }
})();
