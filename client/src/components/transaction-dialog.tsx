import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface TransactionInfo {
  authorizationCode?: string;
  nsu?: string;
  terminal?: string;
  installments?: number;
}

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: "credit" | "debit" | "pix";
  onConfirm: (transactionInfo: TransactionInfo) => void;
}

export function TransactionDialog({
  open,
  onOpenChange,
  paymentMethod,
  onConfirm,
}: TransactionDialogProps) {
  const [authorizationCode, setAuthorizationCode] = useState("");
  const [nsu, setNsu] = useState("");
  const [terminal, setTerminal] = useState("");
  const [installments, setInstallments] = useState<number>(1);

  // Estados para armazenar erros
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateFields = () => {
    let newErrors: { [key: string]: string } = {};

    if (!authorizationCode.trim()) {
      newErrors.authorizationCode = "O código de autorização é obrigatório.";
    }
    if (!nsu.trim()) {
      newErrors.nsu = "O NSU é obrigatório.";
    }
    if (!terminal.trim()) {
      newErrors.terminal = "O terminal é obrigatório.";
    }
    if (paymentMethod === "credit" && (installments < 1 || installments > 12)) {
      newErrors.installments = "O número de parcelas deve estar entre 1 e 12.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Retorna true se não houver erros
  };

  const handleConfirm = () => {
    if (!validateFields()) return;

    onConfirm({
      authorizationCode,
      nsu,
      terminal,
      installments: paymentMethod === "credit" ? installments : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg md:max-w-xl lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Dados da Transação - {paymentMethod === "credit"
              ? "Cartão de Crédito"
              : paymentMethod === "debit"
                ? "Cartão de Débito"
                : "PIX"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="authCode" className="text-right">
              Código de Autorização
            </Label>
            <div className="col-span-3">
              <Input
                id="authCode"
                value={authorizationCode}
                onChange={(e) => setAuthorizationCode(e.target.value)}
                className="w-full"
              />
              {errors.authorizationCode && (
                <p className="text-red-500 text-sm">{errors.authorizationCode}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="nsu" className="text-right">
              NSU
            </Label>
            <div className="col-span-3">
              <Input
                id="nsu"
                value={nsu}
                onChange={(e) => setNsu(e.target.value)}
                className="w-full"
              />
              {errors.nsu && (
                <p className="text-red-500 text-sm">{errors.nsu}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="terminal" className="text-right">
              Terminal
            </Label>
            <div className="col-span-3">
              <Input
                id="terminal"
                value={terminal}
                onChange={(e) => setTerminal(e.target.value)}
                className="w-full"
              />
              {errors.terminal && (
                <p className="text-red-500 text-sm">{errors.terminal}</p>
              )}
            </div>
          </div>
          {paymentMethod === "credit" && (
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="installments" className="text-right">
                Parcelas
              </Label>
              <div className="col-span-3">
                <Input
                  id="installments"
                  type="number"
                  min={1}
                  max={12}
                  value={installments}
                  onChange={(e) =>
                    setInstallments(parseInt(e.target.value) || 1)
                  }
                  className="w-full"
                />
                {errors.installments && (
                  <p className="text-red-500 text-sm">{errors.installments}</p>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleConfirm} className="w-full sm:w-auto">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
