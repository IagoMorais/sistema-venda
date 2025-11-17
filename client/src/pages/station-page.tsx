import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { ProductStation, OrderItemStatus } from "@shared/schema";

interface StationOrderItem {
  id: number;
  quantity: number;
  status: OrderItemStatus;
  createdAt: string | null;
  productId: number;
  product: {
    name: string;
    brand: string;
    station: ProductStation;
  };
}

interface StationOrder {
  id: number;
  tableNumber: string;
  status: string;
  createdAt: string;
  items: StationOrderItem[];
}

interface StationPageProps {
  station: ProductStation;
}

export default function StationPage({ station }: StationPageProps) {
  const { toast } = useToast();
  const queueQuery = useQuery<StationOrder[]>({
    queryKey: ["/api/station/items", station],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/station/items");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? "Erro ao buscar itens");
      }
      return data as StationOrder[];
    },
    refetchInterval: 30_000,
  });

  const updateItemStatus = useMutation({
    mutationFn: async (orderItemId: number) => {
      const res = await apiRequest("PATCH", `/api/order-items/${orderItemId}/status`, {
        status: "ready",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? "Erro ao atualizar item");
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Item atualizado",
        description: "O item foi marcado como pronto.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/station/items", station] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const orders = useMemo(() => queueQuery.data ?? [], [queueQuery.data]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">
          {station === "kitchen" ? "Cozinha" : "Bar"} — Pedidos Pendentes
        </h1>
        <p className="text-sm text-muted-foreground">
          Itens aguardando preparo. Atualize o status quando estiverem prontos.
        </p>
      </header>

      {queueQuery.isLoading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando filas...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          Nenhum item pendente no momento.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Mesa {order.tableNumber}</span>
                  <Badge variant="secondary">#{order.id}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold leading-tight">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Quantidade: {item.quantity}
                        </p>
                      </div>
                      <Badge>{item.status}</Badge>
                    </div>
                    <Button
                      className="mt-3 w-full"
                      size="sm"
                      variant="secondary"
                      disabled={updateItemStatus.isPending}
                      onClick={() => updateItemStatus.mutate(item.id)}
                    >
                      Marcar como pronto
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
