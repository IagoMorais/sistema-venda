import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function ShortcutsHelp() {
  const { user } = useAuth();

  const shortcuts = [
    { keys: ["Ctrl", "+", "D"], description: "Ir para Dashboard" },
    { keys: ["Ctrl", "+", "V"], description: "Ir para Vendas" },
    { keys: ["Ctrl", "+", "/"], description: "Focar na pesquisa" },
    { keys: ["H"], description: "Ir para Home" },
    { keys: ["T"], description: "Alternar tema" },
  ];

  if (user?.role === "admin") {
    shortcuts.push({ keys: ["Ctrl", "+", "U"], description: "Ir para Usuários" });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <Keyboard className="h-4 w-4" />
          <span className="sr-only">Atalhos do teclado</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atalhos do Teclado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.keys.join("")}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, index) => (
                  <kbd
                    key={index}
                    className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
