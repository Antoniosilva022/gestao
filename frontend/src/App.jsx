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

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Carregando...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="vendas" element={<Vendas />} />
            <Route path="vendas/nova" element={<NovaVenda />} />
            <Route path="comandas" element={<Comandas />} />
            <Route path="comandas/:id" element={<ComandaDetalhe />} />
            <Route path="estoque" element={<Estoque />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="funcionarios" element={<Funcionarios />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="resumo-negocios" element={<ResumoNegocios />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
