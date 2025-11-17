
import React from 'react';
import { Link } from 'react-router-dom';

interface Item {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
}

interface ItemGridProps {
  items: Item[];
  baseUrl: string;
}

export function ItemGrid({ items, baseUrl }: ItemGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
      {items.map((item) => (
        <Link 
          to={`${baseUrl}/${item.id}`} 
          key={item.id}
          className="bg-card hover:bg-card/90 rounded-lg shadow-md overflow-hidden transition-all hover:scale-105"
        >
          <div className="aspect-square relative">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-muted-foreground">Sem imagem</span>
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-medium text-sm line-clamp-1">{item.name}</h3>
            <p className="text-primary font-bold mt-1">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(item.price)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
