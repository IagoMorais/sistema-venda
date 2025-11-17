
import React from 'react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  name: string;
  price: string;
  inStock?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ProductCard({ name, price, inStock = true, onClick, className }: ProductCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-slate-800 rounded-sm p-1.5 shadow-xs border-[0.5px]", 
        "flex flex-col h-16 w-[70px]", // Tamanho ultrarreduzido para otimização de espaço
        !inStock && "opacity-60",
        "cursor-pointer hover:border-primary/50 transition-colors",
        className
      )}
    >
      <div className="font-medium text-[10px] truncate">{name}</div>
      <div className="text-[10px] text-muted-foreground mt-0">R${price}</div>
      {!inStock && <div className="text-[8px] text-red-500 mt-auto">Sem estoque</div>}
    </div>
  );
}
