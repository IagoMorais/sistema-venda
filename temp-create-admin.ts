import { hashPassword } from "./server/utils";
import { db } from "./server/db";
import { users } from "./shared/schema";

async function createAdmin() {
  const hashedPassword = await hashPassword("admin123");
  
  const [user] = await db.insert(users).values({
    username: "admin",
    password: hashedPassword,
    role: "admin",
  }).returning();

  console.log("Admin user created:", user);
}

createAdmin().catch(console.error);
