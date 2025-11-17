
import { db } from "../server/db";
import { users, products, orders, orderItems } from "../shared/schema";

async function verifyDatabase() {
  console.log("Verificando banco de dados...");

  try {
    const allUsers = await db.select().from(users);
    console.log("Usuários encontrados:", allUsers.length);
    
    const allProducts = await db.select().from(products);
    console.log("Produtos encontrados:", allProducts.length);
    
    const allOrders = await db.select().from(orders);
    console.log("Pedidos encontrados:", allOrders.length);
    
    const allOrderItems = await db.select().from(orderItems);
    console.log("Itens de pedido encontrados:", allOrderItems.length);
    
    console.log("✅ Banco de dados verificado com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ Erro ao verificar banco de dados:", error);
    return false;
  }
}

verifyDatabase().catch(console.error);
