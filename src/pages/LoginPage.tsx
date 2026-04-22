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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-6 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ventas Bodega</h1>
          <p className="text-gray-600 mt-2 text-base">Ingreso simple y claro</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

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

        <div className="mt-6 text-center border-t border-gray-200 pt-5">
          <p className="text-gray-600 mb-2">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
          </p>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold text-gray-900 hover:text-gray-700 transition-colors"
          >
            {isLogin ? "Crear una nueva" : "Ingresar"}
          </button>
        </div>

        <div className="mt-5 p-3 bg-gray-50 rounded border border-gray-200">
          <p className="text-sm text-gray-700">
            Usa tu correo y contraseña para ingresar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
