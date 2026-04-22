import React from "react";

interface ProductRowProps {
  producto: string;
  precio: number;
  onProductChange: (value: string) => void;
  onPrecioChange: (value: number) => void;
  onRemove: () => void;
}

export const ProductRow: React.FC<ProductRowProps> = ({
  producto,
  precio,
  onProductChange,
  onPrecioChange,
  onRemove,
}) => {
  return (
    <div className="flex gap-2 items-end mb-3">
      <input
        type="text"
        value={producto}
        onChange={(e) => onProductChange(e.target.value)}
        placeholder="Producto"
        className="input-large flex-1"
      />
      <input
        type="number"
        value={precio}
        onChange={(e) => onPrecioChange(parseFloat(e.target.value))}
        placeholder="Precio"
        className="input-large w-24"
      />
      <button
        onClick={onRemove}
        className="btn-danger py-3 px-3 w-12 h-12 flex items-center justify-center"
      >
        ×
      </button>
    </div>
  );
};