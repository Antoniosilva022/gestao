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
    <aside className="fixed bottom-0 left-0 right-0 z-40 flex h-16 bg-blue-900 text-white shadow-[0_-4px_16px_rgba(15,23,42,0.18)] md:static md:h-auto md:w-64 md:flex-col md:shadow-none">
      <div className="hidden p-6 md:block md:border-b md:border-blue-800">
        <h1 className="text-xl font-bold">🏢 Gestão Empresa</h1>
        <p className="text-blue-300 text-xs mt-1">Sistema de Gestão</p>
      </div>
      <nav className="flex w-full items-stretch justify-around gap-1 overflow-x-auto p-1 md:block md:flex-1 md:space-y-1 md:overflow-y-auto md:p-4">
        {menus.map((menu) => {
          if (!menu.perfis.includes(usuario?.perfil)) return null;
          return (
            <NavLink
              key={menu.to}
              to={menu.to}
              end={menu.exact}
              className={({ isActive }) =>
                `flex min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors md:flex-none md:flex-row md:gap-3 md:px-4 md:py-2.5 md:text-sm ${
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
      <div className="hidden p-4 md:block md:border-t md:border-blue-800">
        <p className="text-blue-300 text-xs">
          {usuario?.nome}<br />
          <span className="capitalize">{usuario?.perfil}</span>
        </p>
      </div>
    </aside>
  );
}
