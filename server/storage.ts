import {
  Product,
  InsertProduct,
  User,
  Order,
  OrderItem,
  CreateOrderInput,
  CheckoutOrderInput,
  UpdateOrderItemStatusInput,
  ProductStation,
  paymentMethods,
  productStations,
  orderItemStatuses,
  orders,
  orderItems,
  products,
  users,
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { and, eq, inArray, lte } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

type OrderWithItems = Order & { items: Array<OrderItem & { product: Pick<Product, "name" | "brand" | "station"> }> };

const toDecimalString = (value: number) => {
  if (!Number.isFinite(value)) {
    throw new Error("Valor numérico inválido");
  }
  return value.toFixed(2);
};

const ensureValidStation = (station: string): station is ProductStation =>
  (productStations as readonly string[]).includes(station);

const ensureValidPayment = (payment: string): payment is typeof paymentMethods[number] =>
  (paymentMethods as readonly string[]).includes(payment);

const normalizeNumberInput = (input: unknown, field: string): number => {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) {
      throw new Error(`${field} inválido`);
    }
    return input;
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error(`${field} é obrigatório`);
    }
    const normalized = trimmed.replace(",", ".");
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      throw new Error(`${field} inválido`);
    }
    return parsed;
  }

  throw new Error(`${field} inválido`);
};

const ensureNonNegative = (value: number, field: string) => {
  if (value < 0) {
    throw new Error(`${field} deve ser maior ou igual a zero`);
  }
  return value;
};

const ensureInteger = (value: number, field: string) => {
  if (!Number.isInteger(value)) {
    throw new Error(`${field} deve ser um número inteiro`);
  }
  return value;
};

export interface IStorage {
  sessionStore: session.Store;
  getUser(id: number): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">): Promise<User>;
  getUsers(): Promise<User[]>;

  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct & { createdBy: number }): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  getLowStockProducts(): Promise<Product[]>;

  createOrder(waiterId: number, payload: CreateOrderInput): Promise<OrderWithItems>;
  getOrderWithItems(orderId: number): Promise<OrderWithItems | undefined>;
  getStationQueue(station: ProductStation): Promise<OrderWithItems[]>;
  updateOrderItemStatus(orderItemId: number, input: UpdateOrderItemStatusInput): Promise<OrderItem>;
  getOrdersByStatus(status: Order["status"]): Promise<OrderWithItems[]>;
  checkoutOrder(orderId: number, cashierId: number, input: CheckoutOrderInput): Promise<OrderWithItems>;
  cancelOrder(orderId: number): Promise<OrderWithItems>;

  getSalesStats(): Promise<{
    totalSales: number;
    totalRevenue: number;
    topProducts: { productId: number; quantity: number }[];
  }>;
}

const mapOrderRows = (rows: Array<{
  order: Order;
  item?: OrderItem | null;
  product?: Product | null;
}>): OrderWithItems[] => {
  const map = new Map<number, OrderWithItems>();

  for (const row of rows) {
    const baseOrder = map.get(row.order.id);
    if (!baseOrder) {
      map.set(row.order.id, {
        ...row.order,
        items: [],
      });
    }
    if (row.item && row.product) {
      map.get(row.order.id)!.items.push({
        ...row.item,
        product: {
          name: row.product.name,
          brand: row.product.brand,
          station: row.product.station,
        },
      });
    }
  }

  return Array.from(map.values());
};

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User> {
    const [userRecord] = await db.select().from(users).where(eq(users.id, id));
    if (!userRecord) {
      throw new Error("User not found");
    }
    return userRecord;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const normalizedUsername = username.trim();
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.username, normalizedUsername));
    return userRecord;
  }

  async createUser(user: Omit<User, "id" | "createdAt">): Promise<User> {
    const username = user.username.trim();
    if (!username) {
      throw new Error("Nome de usuário inválido");
    }

    const [newUser] = await db
      .insert(users)
      .values({
        ...user,
        username,
      })
      .returning();
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getProducts(): Promise<Product[]> {
    return db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [productRecord] = await db.select().from(products).where(eq(products.id, id));
    return productRecord;
  }

  async createProduct(product: InsertProduct & { createdBy: number }): Promise<Product> {
    const price = ensureNonNegative(normalizeNumberInput(product.price, "Preço"), "Preço");
    const discount = ensureNonNegative(
      normalizeNumberInput(product.discount ?? 0, "Desconto"),
      "Desconto",
    );
    const quantity = ensureInteger(
      ensureNonNegative(normalizeNumberInput(product.quantity, "Quantidade"), "Quantidade"),
      "Quantidade",
    );
    const minStockLevel = ensureInteger(
      ensureNonNegative(
        normalizeNumberInput(product.minStockLevel, "Estoque mínimo"),
        "Estoque mínimo",
      ),
      "Estoque mínimo",
    );

    if (!ensureValidStation(product.station)) {
      throw new Error("Invalid station provided");
    }

    const insertValues: typeof products.$inferInsert = {
      name: product.name.trim(),
      brand: product.brand.trim(),
      price: toDecimalString(price),
      discount: toDecimalString(discount),
      quantity,
      minStockLevel,
      station: product.station,
      createdBy: product.createdBy,
    };

    if (product.imageUrl !== undefined) {
      const trimmedImageUrl = product.imageUrl.trim();
      insertValues.imageUrl = trimmedImageUrl === "" ? null : trimmedImageUrl;
    }

    const [newProduct] = await db.insert(products).values(insertValues).returning();

    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    const formattedUpdates: Partial<Product> = { ...updates };

    if (updates.price !== undefined) {
      const parsedPrice = ensureNonNegative(
        normalizeNumberInput(updates.price, "Preço"),
        "Preço",
      );
      formattedUpdates.price = toDecimalString(parsedPrice);
    }
    if (updates.discount !== undefined) {
      const parsedDiscount = ensureNonNegative(
        normalizeNumberInput(updates.discount, "Desconto"),
        "Desconto",
      );
      formattedUpdates.discount = toDecimalString(parsedDiscount);
    }
    if (updates.quantity !== undefined) {
      const parsedQuantity = ensureInteger(
        ensureNonNegative(normalizeNumberInput(updates.quantity, "Quantidade"), "Quantidade"),
        "Quantidade",
      );
      formattedUpdates.quantity = parsedQuantity;
    }
    if (updates.minStockLevel !== undefined) {
      const parsedMinStock = ensureInteger(
        ensureNonNegative(
          normalizeNumberInput(updates.minStockLevel, "Estoque mínimo"),
          "Estoque mínimo",
        ),
        "Estoque mínimo",
      );
      formattedUpdates.minStockLevel = parsedMinStock;
    }
    if (updates.name !== undefined) {
      formattedUpdates.name = updates.name.trim();
    }
    if (updates.brand !== undefined) {
      formattedUpdates.brand = updates.brand.trim();
    }
    if (updates.imageUrl !== undefined) {
      formattedUpdates.imageUrl = updates.imageUrl?.trim() || null;
    }
    if (updates.station && !ensureValidStation(updates.station)) {
      throw new Error("Invalid station provided");
    }

    const [updatedProduct] = await db
      .update(products)
      .set(formattedUpdates)
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      throw new Error("Product not found");
    }

    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getLowStockProducts(): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(lte(products.quantity, products.minStockLevel));
  }

  async createOrder(waiterId: number, payload: CreateOrderInput): Promise<OrderWithItems> {
    return db.transaction(async (tx) => {
      const productIds = payload.items.map((item) => item.productId);
      const productRecords = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds));

      const productsById = new Map(productRecords.map((product) => [product.id, product]));
      const requiredQuantities = new Map<number, number>();

      for (const item of payload.items) {
        requiredQuantities.set(
          item.productId,
          (requiredQuantities.get(item.productId) ?? 0) + item.quantity,
        );
      }

      for (const [productId, required] of requiredQuantities.entries()) {
        const product = productsById.get(productId);
        if (!product) {
          throw new Error(`Produto ${productId} não encontrado`);
        }
        if (product.quantity < required) {
          throw new Error(`Estoque insuficiente para ${product.name}`);
        }
      }

      const [orderRecord] = await tx
        .insert(orders)
        .values({
          tableNumber: payload.tableNumber,
          waiterId,
          status: "open",
          totalAmount: "0",
        })
        .returning();

      if (!orderRecord) {
        throw new Error("Não foi possível criar o pedido");
      }

      let runningTotal = 0;
      const createdItems: OrderWithItems["items"] = [];

      for (const item of payload.items) {
        const product = { ...productsById.get(item.productId)! };

        const numericPrice = Number(product.price);
        runningTotal += numericPrice * item.quantity;

        await tx
          .update(products)
          .set({ quantity: product.quantity - item.quantity })
          .where(eq(products.id, product.id));

        productsById.set(product.id, {
          ...product,
          quantity: product.quantity - item.quantity,
        });

        const [orderItemRecord] = await tx
          .insert(orderItems)
          .values({
            orderId: orderRecord.id,
            productId: product.id,
            quantity: item.quantity,
            priceAtTime: toDecimalString(numericPrice),
            station: product.station,
            status: "pending",
          })
          .returning();

        createdItems.push({
          ...orderItemRecord,
          product: {
            name: product.name,
            brand: product.brand,
            station: product.station,
          },
        });
      }

      const totalAsString = toDecimalString(runningTotal);
      const [updatedOrder] = await tx
        .update(orders)
        .set({ totalAmount: totalAsString })
        .where(eq(orders.id, orderRecord.id))
        .returning();

      return {
        ...(updatedOrder ?? { ...orderRecord, totalAmount: totalAsString }),
        items: createdItems,
      };
    });
  }

  async getOrderWithItems(orderId: number): Promise<OrderWithItems | undefined> {
    const rows = await db
      .select({
        order: orders,
        item: orderItems,
        product: products,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.id, orderId));

    if (rows.length === 0) {
      return undefined;
    }

    return mapOrderRows(rows)[0];
  }

  async getStationQueue(station: ProductStation): Promise<OrderWithItems[]> {
    const rows = await db
      .select({
        order: orders,
        item: orderItems,
        product: products,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(and(eq(orderItems.station, station), eq(orderItems.status, "pending")));

    return mapOrderRows(rows);
  }

  async updateOrderItemStatus(orderItemId: number, input: UpdateOrderItemStatusInput): Promise<OrderItem> {
    if (!orderItemStatuses.includes(input.status)) {
      throw new Error("Status inválido para item do pedido");
    }

    const [updated] = await db
      .update(orderItems)
      .set({ status: input.status })
      .where(eq(orderItems.id, orderItemId))
      .returning();

    if (!updated) {
      throw new Error("Item do pedido não encontrado");
    }

    return updated;
  }

  async getOrdersByStatus(status: Order["status"]): Promise<OrderWithItems[]> {
    const rows = await db
      .select({
        order: orders,
        item: orderItems,
        product: products,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orders.status, status));

    return mapOrderRows(rows);
  }

  async checkoutOrder(orderId: number, cashierId: number, input: CheckoutOrderInput): Promise<OrderWithItems> {
    if (!ensureValidPayment(input.paymentMethod)) {
      throw new Error("Forma de pagamento inválida");
    }

    return db.transaction(async (tx) => {
      const order = await this.getOrderWithItems(orderId);
      if (!order) {
        throw new Error("Pedido não encontrado");
      }
      if (order.status !== "open") {
        throw new Error("Pedido não está aberto para finalização");
      }

      const hasPendingItems = order.items.some(
        (item) => item.status !== "ready" && item.status !== "delivered",
      );
      if (hasPendingItems) {
        throw new Error("Todos os itens precisam estar prontos antes de finalizar");
      }

      const computedTotal = order.items.reduce(
        (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
        0,
      );
      const amountFromInput = Number(input.totalAmount);
      const totalToPersist = toDecimalString(
        Number.isFinite(amountFromInput) ? amountFromInput : computedTotal,
      );

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: "paid",
          cashierId,
          paymentMethod: input.paymentMethod,
          totalAmount: totalToPersist,
          closedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        throw new Error("Falha ao finalizar pedido");
      }

      return {
        ...updatedOrder,
        items: order.items,
      };
    });
  }

  async cancelOrder(orderId: number): Promise<OrderWithItems> {
    return db.transaction(async (tx) => {
      const order = await this.getOrderWithItems(orderId);
      if (!order) {
        throw new Error("Pedido não encontrado");
      }

      if (order.status === "cancelled") {
        return order;
      }

      for (const item of order.items) {
        const [productRecord] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (productRecord) {
          await tx
            .update(products)
            .set({ quantity: productRecord.quantity + item.quantity })
            .where(eq(products.id, item.productId));
        }
      }

      const [updatedOrder] = await tx
        .update(orders)
        .set({
          status: "cancelled",
          closedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        throw new Error("Falha ao cancelar pedido");
      }

      return {
        ...updatedOrder,
        items: order.items,
      };
    });
  }

  async getSalesStats() {
    const paidOrders = await db.select().from(orders).where(eq(orders.status, "paid"));
    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount ?? 0),
      0,
    );

    const totalsByProduct = await db
      .select({
        productId: orderItems.productId,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.status, "paid"));

    const productSales = totalsByProduct.reduce<Record<number, number>>((acc, row) => {
      acc[row.productId] = (acc[row.productId] ?? 0) + row.quantity;
      return acc;
    }, {});

    const topProducts = Object.entries(productSales)
      .map(([productId, quantity]) => ({
        productId: Number(productId),
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalSales: paidOrders.length,
      totalRevenue,
      topProducts,
    };
  }
}

export const storage = new DatabaseStorage();
