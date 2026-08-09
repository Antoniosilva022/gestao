import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('admin@empresa.com');
  const [senha, setSenha] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const { usuario, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (usuario) {
      navigate('/', { replace: true });
    }
  }, [usuario, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, senha);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err?.response?.data?.error || 'Credenciais inválidas';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏢</div>
          <h1 className="text-2xl font-bold text-gray-800">Gestão Empresa</h1>
          <p className="text-gray-500 text-sm mt-1">Faça login para continuar</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">E-mail</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@empresa.com" required />
          </div>
          <div>
            <label className="label">Senha</label>
            <input type="password" className="input" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">
          Padrão: admin@empresa.com / admin123
        </p>
      </div>
    </div>
  );
}
