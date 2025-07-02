import React from 'react';
import { Church } from 'lucide-react';

export const Loading: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-bounce-subtle">
          <Church className="h-12 w-12 text-primary-600 mx-auto" />
        </div>
        <p className="mt-4 text-lg text-gray-600">MyWebLife</p>
        <p className="text-sm text-gray-500">Carregando...</p>
      </div>
    </div>
  );
};