import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { Notification } from '../../types';
import { NotificationForm } from '../Notifications/NotificationForm';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userNotifications = await notificationService.getByUser(user.id, user.role);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Superadmin e líderes podem criar mensagens (não membros)
  const canCreateMessage = () => {
    if (!user) return false;
    return user.role !== 'membro_life'; // Todos exceto membros
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'event':
        return '📅';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
          <p className="text-sm text-gray-500">
            {canCreateMessage() 
              ? 'Visualize e gerencie suas mensagens e notificações'
              : 'Visualize suas mensagens e notificações recebidas'
            }
          </p>
        </div>
        {canCreateMessage() && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Mensagem
          </button>
        )}
      </div>

      {/* Aviso para membros */}
      {!canCreateMessage() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Informação:</strong> Apenas líderes podem enviar mensagens. Você pode visualizar e ler as mensagens recebidas.
            </p>
          </div>
        </div>
      )}

      {/* Privilégios do Superadmin */}
      {user?.role === 'superadmin' && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Send className="h-5 w-5 text-primary-600" />
            <p className="text-sm text-primary-800">
              <strong>Super Administrador:</strong> Você pode enviar mensagens para qualquer nível hierárquico e visualizar todas as mensagens do sistema.
            </p>
          </div>
        </div>
      )}

      {/* Lista de Mensagens */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {user?.role === 'superadmin' ? 'Todas as Mensagens do Sistema' : 
             canCreateMessage() ? 'Todas as Mensagens' : 'Mensagens Recebidas'}
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nenhuma mensagem</p>
              <p className="text-sm">
                {canCreateMessage() 
                  ? 'Você não tem mensagens no momento'
                  : 'Você não recebeu mensagens ainda'
                }
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50 border-l-4 border-l-primary-500' : ''
                }`}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                      {getMessageIcon(notification.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-lg font-medium ${
                        !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                        )}
                        <span className="text-sm text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-600 whitespace-pre-wrap">
                        {notification.message}
                      </p>
                    </div>
                    
                    {notification.image_url && (
                      <div className="mt-4">
                        <img
                          src={notification.image_url}
                          alt="Anexo da mensagem"
                          className="max-w-full h-64 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                      <span className="inline-flex items-center">
                        <span className="capitalize">{notification.type === 'event' ? 'Evento' : 'Mensagem'}</span>
                      </span>
                      {notification.read_at && (
                        <span>
                          Lida em {new Date(notification.read_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {/* Mostrar destinatários para superadmin */}
                      {user?.role === 'superadmin' && (
                        <span>
                          Destinatários: {notification.target_roles.length > 0 
                            ? `${notification.target_roles.length} função(ões)` 
                            : `${notification.target_users.length} usuário(s)`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Nova Mensagem - Para líderes e superadmin */}
      {showForm && canCreateMessage() && (
        <NotificationForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchNotifications();
          }}
        />
      )}
    </div>
  );
};