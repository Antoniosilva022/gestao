import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Produtos = lazy(() => import('./pages/Produtos'));
const Vendas = lazy(() => import('./pages/Vendas'));
const NovaVenda = lazy(() => import('./pages/NovaVenda'));
const Comandas = lazy(() => import('./pages/Comandas'));
const ComandaDetalhe = lazy(() => import('./pages/ComandaDetalhe'));
const Estoque = lazy(() => import('./pages/Estoque'));
const Financeiro = lazy(() => import('./pages/Financeiro'));
const Funcionarios = lazy(() => import('./pages/Funcionarios'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const ResumoNegocios = lazy(() => import('./pages/ResumoNegocios'));

function PrivateRoute({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ roles, children }) {
  const { usuario } = useAuth();
  return roles.includes(usuario?.perfil) ? children : <Navigate to={usuario?.perfil === 'garcom' ? '/comandas' : '/'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Carregando...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<RoleRoute roles={['admin', 'gerente', 'operador']}><Dashboard /></RoleRoute>} />
            <Route path="clientes" element={<RoleRoute roles={['admin', 'gerente', 'operador']}><Clientes /></RoleRoute>} />
            <Route path="produtos" element={<RoleRoute roles={['admin', 'gerente', 'operador']}><Produtos /></RoleRoute>} />
            <Route path="vendas" element={<RoleRoute roles={['admin', 'gerente', 'operador']}><Vendas /></RoleRoute>} />
            <Route path="vendas/nova" element={<RoleRoute roles={['admin', 'gerente', 'operador']}><NovaVenda /></RoleRoute>} />
            <Route path="comandas" element={<RoleRoute roles={['admin', 'gerente', 'operador', 'garcom']}><Comandas /></RoleRoute>} />
            <Route path="comandas/:id" element={<RoleRoute roles={['admin', 'gerente', 'operador', 'garcom']}><ComandaDetalhe /></RoleRoute>} />
            <Route path="estoque" element={<RoleRoute roles={['admin', 'gerente', 'operador']}><Estoque /></RoleRoute>} />
            <Route path="financeiro" element={<RoleRoute roles={['admin', 'gerente', 'operador']}><Financeiro /></RoleRoute>} />
            <Route path="funcionarios" element={<RoleRoute roles={['admin', 'gerente', 'operador']}><Funcionarios /></RoleRoute>} />
            <Route path="usuarios" element={<RoleRoute roles={['admin']}><Usuarios /></RoleRoute>} />
            <Route path="resumo-negocios" element={<RoleRoute roles={['admin', 'gerente', 'operador']}><ResumoNegocios /></RoleRoute>} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
