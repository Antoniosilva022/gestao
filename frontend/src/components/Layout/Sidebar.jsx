import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menus = [
  { to: '/', label: 'Dashboard', icon: '📊', exact: true, perfis: ['admin', 'gerente', 'operador'] },
  { to: '/clientes', label: 'Clientes', icon: '👥', perfis: ['admin', 'gerente', 'operador'] },
  { to: '/produtos', label: 'Produtos', icon: '📦', perfis: ['admin', 'gerente', 'operador'] },
  { to: '/vendas', label: 'Vendas', icon: '🛒', perfis: ['admin', 'gerente', 'operador'] },
  { to: '/comandas', label: 'Comandas', icon: '🍽️', perfis: ['admin', 'gerente', 'operador', 'garcom'] },
  { to: '/estoque', label: 'Estoque', icon: '🏭', perfis: ['admin', 'gerente', 'operador'] },
  { to: '/financeiro', label: 'Financeiro', icon: '💰', perfis: ['admin', 'gerente', 'operador'] },
  { to: '/resumo-negocios', label: 'Resumo', icon: '📋', perfis: ['admin', 'gerente', 'operador'] },
  { to: '/funcionarios', label: 'Funcionários', icon: '👤', perfis: ['admin', 'gerente', 'operador'] },
  { to: '/usuarios', label: 'Usuários', icon: '🔐', perfis: ['admin'] },
];

export default function Sidebar() {
  const { usuario } = useAuth();

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-xl font-bold">🏢 Gestão Empresa</h1>
        <p className="text-blue-300 text-xs mt-1">Sistema de Gestão</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menus.map((menu) => {
          if (!menu.perfis.includes(usuario?.perfil)) return null;
          return (
            <NavLink
              key={menu.to}
              to={menu.to}
              end={menu.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <span>{menu.icon}</span>
              {menu.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-blue-800">
        <p className="text-blue-300 text-xs">
          {usuario?.nome}<br />
          <span className="capitalize">{usuario?.perfil}</span>
        </p>
      </div>
    </aside>
  );
}
