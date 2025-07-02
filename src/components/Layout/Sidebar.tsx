import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  X,
  Church,
  Target,
  MessageSquare,
  Network,
  MapPin,
  Building,
  UserCheck,
  Shield,
  Search,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_HIERARCHY } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const getMenuItems = () => {
    const baseItems = [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
    ];

    // Buscar Lifegroups - Para todos os líderes (incluindo líderes de life)
    if (user && user.role !== 'membro_life') {
      baseItems.push({ icon: Search, label: 'Buscar Lifegroups', path: '/search-lifegroups' });
    }

    // Líderes/Membros - Para líderes superiores (não membros e não líderes de life)
    if (user && user.role !== 'membro_life' && user.role !== 'lider_life') {
      baseItems.push({ icon: Users, label: 'Líderes/Membros', path: '/users' });
    }

    // Eventos - Para todos
    baseItems.push({ icon: Calendar, label: 'Eventos', path: '/events' });

    // Checkins - Nome diferente baseado na função
    if (user && user.role !== 'membro_life') {
      // Para líderes: "Checkins" (veem próprios + subordinados)
      baseItems.push({ icon: CheckSquare, label: 'Checkins', path: '/my-checkins' });
    } else {
      // Para membros: "Meus Checkins" (veem apenas próprios)
      baseItems.push({ icon: CheckSquare, label: 'Meus Checkins', path: '/my-checkins' });
    }

    // Mensagens - Para todos (mas com funcionalidades diferentes)
    baseItems.push({ icon: MessageSquare, label: 'Mensagens', path: '/messages' });

    // Menu específico do grupo baseado na função (apenas para líderes)
    if (user && user.role !== 'membro_life') {
      let groupMenuItem = null;
      
      switch (user.role) {
        case 'pastor_rede':
          groupMenuItem = { icon: Network, label: 'Minha Rede', path: '/my-group' };
          break;
        case 'lider_area':
          groupMenuItem = { icon: MapPin, label: 'Minha Área', path: '/my-group' };
          break;
        case 'lider_setor':
          groupMenuItem = { icon: Building, label: 'Meu Setor', path: '/my-group' };
          break;
        case 'lider_life':
          groupMenuItem = { icon: UserCheck, label: 'Meu Lifegroup', path: '/my-group' };
          break;
      }
      
      if (groupMenuItem) {
        baseItems.push(groupMenuItem);
      }
    }

    // Trilhos - Para todos os usuários (hierárquico)
    if (user?.role === 'membro_life') {
      baseItems.push({ icon: Target, label: 'Meu Trilho', path: '/tracks' });
    } else if (user) {
      baseItems.push({ icon: Target, label: 'Trilhos', path: '/tracks' });
    }

    // Relatórios - Para todos
    baseItems.push({ icon: BarChart3, label: 'Relatórios', path: '/reports' });

    // Administração - Apenas para superadmin (ANTES de Configurações)
    if (user?.role === 'superadmin') {
      baseItems.push(
        { icon: Shield, label: 'Administração', path: '/admin' },
        { icon: Network, label: 'Todas as Redes', path: '/all-groups' }
      );
    }

    // Configurações - Para todos (DEPOIS de Administração)
    baseItems.push({ icon: Settings, label: 'Configurações', path: '/settings' });

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Church className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">MyWebLife</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
                onClick={() => onClose()}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Indicador de nível de acesso para superadmin */}
        {user?.role === 'superadmin' && (
          <div className="absolute bottom-16 left-0 right-0 mx-3">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-3 rounded-lg text-center">
              <Shield className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xs font-medium">Acesso Total</p>
              <p className="text-xs opacity-90">Super Administrador</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};