import React from 'react';
import { UserPlus, Calendar, FileText, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_HIERARCHY } from '../../types';

export const QuickActions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getQuickActions = () => {
    const actions = [];

    // Para líderes de life: adicionar membro ao invés de usuário
    if (user?.role === 'lider_life') {
      actions.push({
        name: 'Adicionar Membro',
        description: 'Cadastrar novo membro no lifegroup',
        icon: UserPlus,
        color: 'text-primary-600',
        bgColor: 'bg-primary-100',
        action: () => navigate('/my-group'),
      });
    }

    // Para outros líderes superiores: adicionar usuário
    if (user && ROLE_HIERARCHY[user.role] <= 3) { // Até líder de setor
      actions.push({
        name: 'Adicionar Usuário',
        description: 'Cadastrar novo líder ou membro',
        icon: UserPlus,
        color: 'text-primary-600',
        bgColor: 'bg-primary-100',
        action: () => navigate('/users'),
      });
    }

    // Criar evento - para líderes
    if (user && ROLE_HIERARCHY[user.role] <= 4) {
      actions.push({
        name: 'Criar Evento',
        description: 'Agendar novo evento ou reunião',
        icon: Calendar,
        color: 'text-secondary-600',
        bgColor: 'bg-secondary-100',
        action: () => navigate('/events'),
      });
    }

    // Relatórios - para todos
    actions.push({
      name: 'Relatórios',
      description: 'Visualizar relatórios de presença',
      icon: FileText,
      color: 'text-accent-600',
      bgColor: 'bg-accent-100',
      action: () => navigate('/reports'),
    });

    // Configurações - para todos
    actions.push({
      name: 'Configurações',
      description: 'Ajustar preferências do sistema',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      action: () => navigate('/settings'),
    });

    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.name}
              onClick={action.action}
              className="relative p-4 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors text-left"
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${action.bgColor} rounded-md p-2`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {action.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};