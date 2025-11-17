import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function StockAlert() {
  const { data: lowStockProducts } = useQuery<Product[]>({
    queryKey: ["/api/low-stock"],
  });

  if (!lowStockProducts?.length) return null;

  return (
    <div className="space-y-2">
      {lowStockProducts.map((product) => (
        <Alert variant="destructive" key={product.id}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Stock Alert</AlertTitle>
          <AlertDescription>
            {product.name} is running low! Current stock: {product.quantity}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
