
import React from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
}

export function ResponsiveTable<T>({ 
  data, 
  columns, 
  keyExtractor,
  onRowClick 
}: ResponsiveTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse min-w-full">
        <thead className="bg-muted">
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                className="text-left py-3 px-4 font-medium text-sm text-muted-foreground"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((item) => (
            <tr 
              key={keyExtractor(item)} 
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
            >
              {columns.map((column) => (
                <td key={column.key} className="py-3 px-4 text-sm">
                  {column.render 
                    ? column.render(item) 
                    : (item as any)[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td 
                colSpan={columns.length} 
                className="py-8 text-center text-muted-foreground"
              >
                Nenhum item encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Versão para dispositivos móveis que mostra os dados em formato de cartões
export function MobileCardList<T>({ 
  data, 
  columns, 
  keyExtractor,
  onRowClick 
}: ResponsiveTableProps<T>) {
  return (
    <div className="space-y-4 p-4">
      {data.map((item) => (
        <div 
          key={keyExtractor(item)}
          onClick={onRowClick ? () => onRowClick(item) : undefined}
          className={`bg-card rounded-lg shadow-sm p-4 ${onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}`}
        >
          {columns.map((column) => (
            <div key={column.key} className="flex justify-between py-1 border-b border-border last:border-0">
              <span className="font-medium text-sm">{column.label}</span>
              <span className="text-sm">
                {column.render 
                  ? column.render(item) 
                  : (item as any)[column.key]
                }
              </span>
            </div>
          ))}
        </div>
      ))}
      {data.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          Nenhum item encontrado
        </div>
      )}
    </div>
  );
}

// Componente que escolhe automaticamente entre tabela ou cartões conforme o tamanho da tela
export function AdaptiveTable<T>(props: ResponsiveTableProps<T>) {
  return (
    <>
      <div className="hidden md:block">
        <ResponsiveTable {...props} />
      </div>
      <div className="md:hidden">
        <MobileCardList {...props} />
      </div>
    </>
  );
}
