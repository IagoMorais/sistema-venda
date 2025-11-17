import { storage } from "./storage";
import { hashPassword } from "./utils";

export async function setupDefaultUsers() {
  try {
    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME?.trim() || "admin";
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";

    const defaultUsers = [
      { username: adminUsername, password: adminPassword, role: "admin" as const },
      { username: "waiter", password: "waiter123", role: "waiter" as const },
      { username: "cashier", password: "cashier123", role: "cashier" as const },
      { username: "kitchen", password: "kitchen123", role: "kitchen" as const },
      { username: "bar", password: "bar123", role: "bar" as const },
    ];

    for (const userTemplate of defaultUsers) {
      try {
        const exists = await storage.getUserByUsername(userTemplate.username);
        if (!exists) {
          const hashedPassword = await hashPassword(userTemplate.password);
          await storage.createUser({
            username: userTemplate.username,
            password: hashedPassword,
            role: userTemplate.role,
          });
          console.log(`Usuário ${userTemplate.username} (${userTemplate.role}) criado com sucesso`);
        }
      } catch (error) {
        const errorWithCode = error as { code?: string };
        if (errorWithCode.code === "23505") {
          console.warn(`Usuário ${userTemplate.username} já existe (detecção concorrente).`);
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    console.error("Erro ao criar usuários padrão:", error);
    throw error;
  }
}
