import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { OrderStatus, OrderItemStatus } from "@shared/schema";

interface OrderHistoryItem {
  id: number;
  quantity: number;
  status: OrderItemStatus;
  priceAtTime: string;
  product: {
    name: string;
  };
}

interface OrderHistoryRecord {
  id: number;
  tableNumber: string;
  status: OrderStatus;
  totalAmount: string | null;
  paymentMethod: string | null;
  closedAt: string | null;
  createdAt: string;
  items: OrderHistoryItem[];
}

export function OrdersHistory() {
  const { user } = useAuth();
  const { toast } = useToast();

  const ordersQuery = useQuery<OrderHistoryRecord[]>({
    queryKey: ["/api/orders", "paid"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders?status=paid");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? "Erro ao carregar histórico de pedidos");
      }
      return data as OrderHistoryRecord[];
    },
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: number) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/cancel`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? "Erro ao cancelar pedido");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "paid"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Pedido cancelado",
        description: "O pedido foi cancelado e o estoque atualizado.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Pedidos Finalizados</h2>
          <p className="text-sm text-muted-foreground">
            Histórico de comandas com pagamento concluído.
          </p>
        </div>
        <Badge variant="secondary">
          Total: {ordersQuery.data?.length ?? 0}
        </Badge>
      </div>
      <div className="rounded-lg border">
        <ScrollArea className="h-[400px] sm:h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Mesa</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Finalizado em</TableHead>
                {user?.role === "admin" && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersQuery.data?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.tableNumber}</TableCell>
                  <TableCell>
                    <ul className="space-y-1 text-sm">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.quantity}× {item.product.name}
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell>
                    R$ {(
                      order.totalAmount
                        ? Number(order.totalAmount)
                        : order.items.reduce(
                            (sum, item) =>
                              sum + Number(item.priceAtTime) * item.quantity,
                            0,
                          )
                    ).toFixed(2)}
                  </TableCell>
                  <TableCell>{order.paymentMethod?.toUpperCase() ?? "—"}</TableCell>
                  <TableCell>
                    {order.closedAt
                      ? format(new Date(order.closedAt), "dd/MM/yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  {user?.role === "admin" && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={cancelOrder.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Cancelar este pedido irá devolver os itens ao estoque. Deseja continuar?",
                            )
                          ) {
                            cancelOrder.mutate(order.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
