import React from "react";
import { useNavigate } from "react-router-dom";

const NewSalePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold">Nueva Venta</h1>
        <button onClick={() => navigate(-1)} className="mt-8 w-full py-4 rounded-lg bg-gray-200">
          Volver
        </button>
      </div>
    </div>
  );
};

export default NewSalePage;