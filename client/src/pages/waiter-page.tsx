import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { CartItem, Product } from "@shared/schema";
import { ProductGrid } from "@/components/product-grid";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, Trash2 } from "lucide-react";

interface WaiterOrderPayload {
  tableNumber: string;
  items: Array<{ productId: number; quantity: number }>;
}

export default function WaiterPage() {
  const { toast } = useToast();
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const [tableNumber, setTableNumber] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const totalAmount = useMemo(
    () =>
      cartItems.reduce((sum, item) => {
        const price = Number(item.price);
        return sum + price * item.quantity;
      }, 0),
    [cartItems],
  );

  const addProductToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          quantity: 1,
          name: product.name,
          price: product.price,
          discount: product.discount?.toString() ?? "0",
          station: product.station,
        },
      ];
    });
  };

  const removeProductFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => setCartItems([]);

  const createOrder = useMutation({
    mutationFn: async () => {
      const payload: WaiterOrderPayload = {
        tableNumber: tableNumber.trim(),
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const res = await apiRequest("POST", "/api/orders", payload);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? "Erro ao criar pedido");
      }
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Pedido enviado",
        description: "A comanda foi encaminhada para a produção.",
      });
      setTableNumber("");
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar pedido",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!tableNumber.trim()) {
      toast({
        title: "Mesa obrigatória",
        description: "Informe o número da mesa antes de enviar o pedido.",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens para enviar um pedido.",
        variant: "destructive",
      });
      return;
    }

    createOrder.mutate();
  };

  const selectedQuantities = cartItems.reduce<Record<number, number>>(
    (acc, item) => {
      acc[item.productId] = item.quantity;
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nova Comanda</h1>
          <p className="text-sm text-muted-foreground">
            Selecione os itens e informe a mesa para enviar à produção.
          </p>
        </div>
        <Input
          value={tableNumber}
          onChange={(event) => setTableNumber(event.target.value)}
          placeholder="Mesa / Comanda"
          className="w-full sm:w-64"
        />
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductGrid
            products={products ?? []}
            onProductSelect={addProductToCart}
            onProductDeselect={removeProductFromCart}
            selectedQuantities={selectedQuantities}
          />
        </div>

        <Card className="h-fit">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Itens da Comanda</CardTitle>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum item selecionado. Toque em um produto para adicioná-lo à comanda.
              </p>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="rounded-md border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium leading-tight">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Enviar para: {item.station === "bar" ? "Bar" : "Cozinha"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeProductFromCart(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="text-sm font-semibold">
                        R$ {(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-3 text-sm">
              <span className="text-muted-foreground">Total Estimado</span>
              <span className="text-base font-semibold">
                R$ {totalAmount.toFixed(2)}
              </span>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={createOrder.isPending || cartItems.length === 0}
            >
              {createOrder.isPending ? "Enviando..." : "Enviar Pedido"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
