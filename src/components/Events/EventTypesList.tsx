import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, Clock, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { eventTypeService } from '../../services/eventService';
import { EventType, ROLE_LABELS, EVENT_TYPE_CREATOR_ROLES } from '../../types';
import { toast } from 'react-toastify';
import { EventTypeForm } from './EventTypeForm';

interface EventTypesListProps {
  onClose: () => void;
}

export const EventTypesList: React.FC<EventTypesListProps> = ({ onClose }) => {
  const { user: currentUser } = useAuth();
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      setLoading(true);
      const data = await eventTypeService.getAll();
      setEventTypes(data);
    } catch (error: any) {
      console.error('Error fetching event types:', error);
      toast.error('Erro ao carregar tipos de eventos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEventType = async (eventTypeId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este tipo de evento?')) return;

    try {
      const success = await eventTypeService.delete(eventTypeId);
      if (success) {
        toast.success('Tipo de evento excluído com sucesso!');
        fetchEventTypes();
      } else {
        throw new Error('Falha ao excluir tipo de evento');
      }
    } catch (error: any) {
      console.error('Error deleting event type:', error);
      toast.error('Erro ao excluir tipo de evento');
    }
  };

  const canManageEventType = (eventType: EventType) => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    return eventType.created_by === currentUser.id;
  };

  const canCreateEventType = () => {
    if (!currentUser) return false;
    return EVENT_TYPE_CREATOR_ROLES.includes(currentUser.role);
  };

  const filteredEventTypes = eventTypes.filter(eventType =>
    eventType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (eventType.description && eventType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (eventType: EventType) => {
    setSelectedEventType(eventType);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedEventType(null);
    setIsEditing(false);
    fetchEventTypes();
  };

  const getDayName = (day: number | null) => {
    if (day === null) return 'Não definido';
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[day] || 'Não definido';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tipos de Eventos</h2>
            <p className="text-sm text-gray-500">
              Gerencie os tipos de eventos pré-configurados
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {canCreateEventType() && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Tipo
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Aviso sobre permissões */}
        {!canCreateEventType() && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>Informação:</strong> Apenas líderes de setor ou superiores podem criar tipos de eventos pré-configurados.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tipos de eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-primary pl-10"
            />
          </div>
        </div>

        {/* Event Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto">
          {filteredEventTypes.map((eventType) => (
            <div key={eventType.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {eventType.name}
                  </h3>
                  {eventType.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {eventType.description}
                    </p>
                  )}
                </div>
                {eventType.is_recurring && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                    Recorrente
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {eventType.default_time && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    {eventType.default_time}
                  </div>
                )}
                {eventType.default_day !== null && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {getDayName(eventType.default_day)}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="h-4 w-4 mr-2" />
                  {eventType.target_roles.length} público(s)
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {eventType.target_roles.slice(0, 3).map(role => (
                  <span
                    key={role}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {ROLE_LABELS[role]}
                  </span>
                ))}
                {eventType.target_roles.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    +{eventType.target_roles.length - 3}
                  </span>
                )}
              </div>

              {canManageEventType(eventType) && (
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleEdit(eventType)}
                    className="text-primary-600 hover:text-primary-900 p-1"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteEventType(eventType.id)}
                    className="text-error-600 hover:text-error-900 p-1"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredEventTypes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nenhum tipo de evento encontrado</p>
              <p className="text-sm">
                {canCreateEventType() 
                  ? 'Crie tipos de eventos para facilitar a criação de eventos futuros'
                  : 'Tipos de eventos criados por líderes superiores aparecerão aqui'
                }
              </p>
            </div>
          </div>
        )}

        {/* Modal Form */}
        {showForm && canCreateEventType() && (
          <EventTypeForm
            eventType={selectedEventType}
            isEditing={isEditing}
            onClose={handleCloseForm}
          />
        )}
      </div>
    </div>
  );
};