import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const toNumber = (
  value: string | number,
  ctx: z.RefinementCtx,
  options: {
    field: string;
    min?: number;
    integer?: boolean;
    allowEmpty?: boolean;
    defaultValue?: number;
  },
) => {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${options.field} inválido`,
      });
      return z.NEVER;
    }
    if (options.min !== undefined && value < options.min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${options.field} deve ser maior ou igual a ${options.min}`,
      });
      return z.NEVER;
    }
    if (options.integer && !Number.isInteger(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${options.field} deve ser um número inteiro`,
      });
      return z.NEVER;
    }
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      if (options.allowEmpty && options.defaultValue !== undefined) {
        return options.defaultValue;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${options.field} é obrigatório`,
      });
      return z.NEVER;
    }

    const normalized = trimmed.replace(",", ".");
    const parsed = Number(normalized);

    if (!Number.isFinite(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${options.field} inválido`,
      });
      return z.NEVER;
    }

    if (options.min !== undefined && parsed < options.min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${options.field} deve ser maior ou igual a ${options.min}`,
      });
      return z.NEVER;
    }

    if (options.integer && !Number.isInteger(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${options.field} deve ser um número inteiro`,
      });
      return z.NEVER;
    }

    return parsed;
  }

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: `${options.field} inválido`,
  });
  return z.NEVER;
};

export const userRoles = ["admin", "waiter", "cashier", "kitchen", "bar"] as const;
export const productStations = ["kitchen", "bar"] as const;
export const orderStatuses = ["open", "paid", "cancelled"] as const;
export const orderItemStatuses = ["pending", "preparing", "ready", "delivered"] as const;
export const paymentMethods = ["cash", "credit", "debit", "pix"] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: userRoles }).notNull().default("waiter"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  minStockLevel: integer("min_stock_level").notNull(),
  imageUrl: text("imageurl"),
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  station: text("station", { enum: productStations }).notNull().default("kitchen"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tableNumber: text("table_number").notNull(),
  status: text("status", { enum: orderStatuses }).notNull().default("open"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  paymentMethod: text("payment_method", { enum: paymentMethods }),
  waiterId: integer("waiter_id").references(() => users.id),
  cashierId: integer("cashier_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtTime: decimal("price_at_time", { precision: 10, scale: 2 }).notNull(),
  station: text("station", { enum: productStations }).notNull(),
  status: text("status", { enum: orderItemStatuses }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = z.object({
  username: z.string().trim().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(userRoles).default("waiter"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertProductSchema = createInsertSchema(products)
  .omit({
    id: true,
    createdBy: true,
  })
  .extend({
    name: z.string().trim().min(1, "Nome é obrigatório"),
    brand: z.string().trim().min(1, "Marca é obrigatória"),
    price: z.union([z.string(), z.number()]).transform((val, ctx) =>
      toNumber(val, ctx, { field: "Preço", min: 0 }),
    ),
    quantity: z.union([z.string(), z.number()]).transform((val, ctx) =>
      toNumber(val, ctx, { field: "Quantidade", min: 0, integer: true }),
    ),
    minStockLevel: z.union([z.string(), z.number()]).transform((val, ctx) =>
      toNumber(val, ctx, { field: "Estoque mínimo", min: 0, integer: true }),
    ),
    discount: z
      .union([z.string(), z.number(), z.undefined()])
      .transform((val, ctx) => {
        if (val === undefined) {
          return 0;
        }
        return toNumber(val, ctx, {
          field: "Desconto",
          min: 0,
          allowEmpty: true,
          defaultValue: 0,
        });
      }),
    imageUrl: z.string().trim().min(1, "URL da imagem inválida").optional(),
    station: z.enum(productStations).default("kitchen"),
  });

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
}).extend({
  totalAmount: z.string().or(z.number()).transform((val) =>
    typeof val === "string" ? parseFloat(val) : val
  ).optional(),
  status: z.enum(orderStatuses).default("open"),
  paymentMethod: z.enum(paymentMethods).optional(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
}).extend({
  priceAtTime: z.string().or(z.number()).transform((val) =>
    typeof val === "string" ? parseFloat(val) : val
  ),
  station: z.enum(productStations),
  status: z.enum(orderItemStatuses).default("pending"),
});

export const createOrderSchema = z.object({
  tableNumber: z.string().min(1, "O número da mesa é obrigatório"),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).min(1),
});

export const updateOrderItemStatusSchema = z.object({
  status: z.enum(orderItemStatuses),
});

export const checkoutOrderSchema = z.object({
  paymentMethod: z.enum(paymentMethods),
  totalAmount: z.string().or(z.number()).transform((val) =>
    typeof val === "string" ? parseFloat(val) : val
  ),
});

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type UserRole = typeof userRoles[number];
export type ProductStation = typeof productStations[number];
export type OrderStatus = typeof orderStatuses[number];
export type OrderItemStatus = typeof orderItemStatuses[number];

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderItemStatusInput = z.infer<typeof updateOrderItemStatusSchema>;
export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>;

export interface CartItem {
  productId: number;
  quantity: number;
  name: string;
  price: string;
  discount: string;
  station?: ProductStation;
}
