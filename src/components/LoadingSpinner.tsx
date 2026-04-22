import React from "react";

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
    </div>
  );
};