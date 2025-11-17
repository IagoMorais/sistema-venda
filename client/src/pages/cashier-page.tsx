import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentMethods, type OrderStatus, type OrderItemStatus } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CashierOrderItem {
  id: number;
  quantity: number;
  status: OrderItemStatus;
  product: {
    name: string;
    brand: string;
    station: string;
  };
  priceAtTime: string;
}

interface CashierOrder {
  id: number;
  tableNumber: string;
  status: OrderStatus;
  totalAmount: string | null;
  createdAt: string;
  items: CashierOrderItem[];
}

export default function CashierPage() {
  const { toast } = useToast();
  const ordersQuery = useQuery<CashierOrder[]>({
    queryKey: ["/api/orders/open"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders/open");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? "Erro ao carregar pedidos");
      }
      return data as CashierOrder[];
    },
    refetchInterval: 20_000,
  });

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<typeof paymentMethods[number]>("cash");

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) {
        throw new Error("Selecione um pedido para finalizar.");
      }

      const total = selectedOrder.totalAmount
        ? Number(selectedOrder.totalAmount)
        : selectedOrder.items.reduce(
            (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
            0,
          );

      const res = await apiRequest("POST", `/api/orders/${selectedOrder.id}/checkout`, {
        paymentMethod,
        totalAmount: total,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? "Erro ao finalizar pedido");
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Pagamento registrado",
        description: "O pedido foi finalizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/open"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedOrderId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao finalizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: async (orderItemId: number) => {
      const res = await apiRequest("PATCH", `/api/order-items/${orderItemId}/status`, {
        status: "delivered",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? "Erro ao atualizar item");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/open"] });
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Pedidos em Aberto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum pedido aguardando pagamento no momento.
            </p>
          ) : (
            orders.map((order) => (
              <button
                key={order.id}
                className={`w-full rounded-md border p-3 text-left transition hover:border-primary ${
                  selectedOrderId === order.id ? "border-primary" : "border-border"
                }`}
                onClick={() => setSelectedOrderId(order.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mesa {order.tableNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} itens
                    </p>
                  </div>
                  <Badge variant="secondary">#{order.id}</Badge>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="min-h-[320px]">
        <CardHeader>
          <CardTitle>Detalhes do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col gap-4">
          {selectedOrder ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">Mesa</p>
                <p className="text-lg font-semibold">{selectedOrder.tableNumber}</p>
              </div>

              <ScrollArea className="max-h-64 rounded-md border">
                <div className="space-y-3 p-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × R$ {Number(item.priceAtTime).toFixed(2)}
                          </p>
                        </div>
                        <Badge>{item.status}</Badge>
                      </div>
                      {item.status === "ready" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-xs"
                          onClick={() => markDeliveredMutation.mutate(item.id)}
                        >
                          Marcar como entregue
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex flex-col gap-2 border-t pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-lg font-semibold">
                    R${" "}
                    {(
                      selectedOrder.totalAmount
                        ? Number(selectedOrder.totalAmount)
                        : selectedOrder.items.reduce(
                            (sum, item) =>
                              sum + Number(item.priceAtTime) * item.quantity,
                            0,
                          )
                    ).toFixed(2)}
                  </span>
                </div>

                <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as typeof paymentMethods[number])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="mt-2"
                  disabled={checkoutMutation.isPending}
                  onClick={() => checkoutMutation.mutate()}
                >
                  {checkoutMutation.isPending ? "Processando..." : "Finalizar Pagamento"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Selecione um pedido na coluna ao lado para ver os detalhes.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
