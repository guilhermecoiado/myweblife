import React from 'react';
import { X, Edit, Calendar, Clock, Users, Repeat, FileText } from 'lucide-react';
import { Event, ROLE_LABELS } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatTime, formatDateTime } from '../../utils/dateUtils';

interface EventDetailsProps {
  event: Event;
  onClose: () => void;
  onEdit: () => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({ event, onClose, onEdit }) => {
  const { user: currentUser } = useAuth();

  const canEdit = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    return event.created_by === currentUser.id;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Detalhes do Evento
              </h3>
              <p className="text-sm text-gray-500">
                Informações completas do evento
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit() && (
              <button
                onClick={onEdit}
                className="btn-secondary"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Título e Descrição */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {event.title}
            </h2>
            {event.description && (
              <p className="text-gray-600">
                {event.description}
              </p>
            )}
          </div>

          {/* Informações do Evento */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Informações do Evento
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </label>
                <div className="mt-1 flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">
                    {formatDate(event.event_date)}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horário
                </label>
                <div className="mt-1 flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">{formatTime(event.event_time)}</p>
                </div>
              </div>
              {event.is_recurring && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recorrência
                  </label>
                  <div className="mt-1 flex items-center">
                    <Repeat className="h-4 w-4 text-gray-400 mr-2" />
                    <p className="text-sm text-gray-900">
                      {event.recurrence_pattern === 'daily' && 'Diário'}
                      {event.recurrence_pattern === 'weekly' && 'Semanal'}
                      {event.recurrence_pattern === 'monthly' && 'Mensal'}
                      {!event.recurrence_pattern && 'Padrão não definido'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Público Alvo */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Público Alvo
            </h4>
            <div className="flex flex-wrap gap-2">
              {event.target_roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {ROLE_LABELS[role]}
                </span>
              ))}
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Informações Adicionais
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateTime(event.created_at)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última atualização
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateTime(event.updated_at)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {event.is_recurring ? 'Evento Recorrente' : 'Evento Único'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};