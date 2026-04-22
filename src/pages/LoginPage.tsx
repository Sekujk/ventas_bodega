import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LargeButton } from "@/components/LargeButton";
import { InputField } from "@/components/InputField";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 flex items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Card */}
      <div className="relative card-elevated w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📱</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ventas Bodega
          </h1>
          <p className="text-gray-600 mt-2">Gestión simple y rápida</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-600 rounded-lg">
            <p className="text-red-700 font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="tu@email.com"
            required
          />
          <InputField
            label="Contraseña"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="••••••••"
            required
          />

          <LargeButton disabled={loading} variant="primary">
            {loading ? "Cargando..." : isLogin ? "Ingresar" : "Crear Cuenta"}
          </LargeButton>
        </form>

        {/* Toggle Auth Mode */}
        <div className="mt-6 text-center border-t border-gray-200 pt-6">
          <p className="text-gray-600 mb-3">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
          </p>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isLogin ? "Crear una nueva" : "Ingresar"}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-gray-700">
            💡 <strong>Prueba:</strong> Usa cualquier email para crear una cuenta de prueba
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
