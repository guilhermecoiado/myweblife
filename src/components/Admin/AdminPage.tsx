import React, { useState, useEffect } from 'react';
import { Shield, Users, Calendar, MessageSquare, BarChart3, Settings, Database, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { eventService } from '../../services/eventService';
import { notificationService } from '../../services/notificationService';
import { attendanceService } from '../../services/attendanceService';
import { User, Event, Notification } from '../../types';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalEvents: 0,
    totalNotifications: 0,
    totalAttendance: 0,
    systemHealth: 'Excelente'
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas gerais
      const users = await userService.getAll();
      const events = await eventService.getAll();
      const notifications = await notificationService.getAll();
      const attendanceStats = await attendanceService.getStats();

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.is_active).length,
        totalEvents: events.length,
        totalNotifications: notifications.length,
        totalAttendance: attendanceStats.totalCheckIns,
        systemHealth: 'Excelente'
      });

      // Atividade recente (últimos 10 itens)
      const activity = [
        ...users.slice(0, 3).map(u => ({
          type: 'user',
          title: 'Novo usuário cadastrado',
          description: `${u.name} foi adicionado ao sistema`,
          time: u.created_at,
          icon: Users
        })),
        ...events.slice(0, 3).map(e => ({
          type: 'event',
          title: 'Evento criado',
          description: `${e.title} foi agendado`,
          time: e.created_at,
          icon: Calendar
        })),
        ...notifications.slice(0, 4).map(n => ({
          type: 'notification',
          title: 'Notificação enviada',
          description: n.title,
          time: n.created_at,
          icon: MessageSquare
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminCards = [
    {
      title: 'Usuários Totais',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} ativos`,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Eventos',
      value: stats.totalEvents,
      subtitle: 'Total de eventos',
      icon: Calendar,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Notificações',
      value: stats.totalNotifications,
      subtitle: 'Mensagens enviadas',
      icon: MessageSquare,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Check-ins',
      value: stats.totalAttendance,
      subtitle: 'Total de presenças',
      icon: Activity,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Sistema',
      value: stats.systemHealth,
      subtitle: 'Status operacional',
      icon: Database,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'Configurações',
      value: 'Ativo',
      subtitle: 'Sistema configurado',
      icon: Settings,
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 text-primary-600 mr-3" />
            Painel de Administração
          </h1>
          <p className="text-sm text-gray-500">
            Visão completa do sistema - Acesso exclusivo do Super Administrador
          </p>
        </div>
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg">
          <p className="text-sm font-medium">Super Admin</p>
          <p className="text-xs opacity-90">{user?.name}</p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${card.bgColor} rounded-md p-3`}>
                  <card.icon className={`h-6 w-6 ${card.textColor}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.title}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {card.value}
                      </div>
                    </dd>
                    <dd className="text-sm text-gray-600">
                      {card.subtitle}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Atividade Recente */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Atividade Recente do Sistema</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Nenhuma atividade recente</p>
            </div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} className="p-6 hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <activity.icon className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-sm text-gray-500">
                    {new Date(activity.time).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ações Rápidas do Admin */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Ações de Administração</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <Users className="h-6 w-6 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Gerenciar Usuários</p>
              <p className="text-xs text-gray-500">Visualizar todos os usuários</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <Calendar className="h-6 w-6 text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Todos os Eventos</p>
              <p className="text-xs text-gray-500">Gerenciar eventos globalmente</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <MessageSquare className="h-6 w-6 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Mensagens Globais</p>
              <p className="text-xs text-gray-500">Enviar para toda a igreja</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <BarChart3 className="h-6 w-6 text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Relatórios Avançados</p>
              <p className="text-xs text-gray-500">Análises completas</p>
            </button>
          </div>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-primary-600" />
          <div>
            <h3 className="text-lg font-medium text-primary-900">Privilégios de Super Administrador</h3>
            <p className="text-sm text-primary-700">
              Você tem acesso completo a todas as funcionalidades do sistema, incluindo:
            </p>
            <ul className="text-sm text-primary-700 mt-2 space-y-1">
              <li>• Gerenciamento completo de usuários e hierarquias</li>
              <li>• Visualização e edição de todos os grupos e redes</li>
              <li>• Acesso a todos os eventos e relatórios</li>
              <li>• Envio de mensagens para qualquer nível hierárquico</li>
              <li>• Configurações avançadas do sistema</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};