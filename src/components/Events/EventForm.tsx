import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Calendar as CalendarIcon, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { eventService, eventTypeService } from '../../services/eventService';
import { Event, EventType, UserRole, ROLE_LABELS, getAvailableEventTargetRoles, EVENT_TYPE_CREATOR_ROLES, ROLE_HIERARCHY } from '../../types';
import { toast } from 'react-toastify';
import { EventTypesList } from './EventTypesList';
import { DateInput } from '../common/DateInput';
import { TimeInput } from '../common/TimeInput';

interface EventFormProps {
  event?: Event | null;
  isEditing?: boolean;
  onClose: () => void;
}

interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  is_recurring: boolean;
  recurrence_pattern: string;
  target_roles: UserRole[];
}

export const EventForm: React.FC<EventFormProps> = ({ event, isEditing = false, onClose }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [showEventTypesManager, setShowEventTypesManager] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EventFormData>({
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      event_date: event?.event_date || '',
      event_time: event?.event_time || '',
      is_recurring: event?.is_recurring || false,
      recurrence_pattern: event?.recurrence_pattern || '',
      target_roles: event?.target_roles || [],
    },
  });

  const isRecurring = watch('is_recurring');
  const selectedRoles = watch('target_roles');
  const eventDate = watch('event_date');
  const eventTime = watch('event_time');

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      const data = await eventTypeService.getAll();
      setEventTypes(data);
    } catch (error: any) {
      console.error('Error fetching event types:', error);
    }
  };

  const handleEventTypeSelect = (eventType: EventType) => {
    setValue('title', eventType.name);
    setValue('description', eventType.description || '');
    setValue('is_recurring', eventType.is_recurring);
    setValue('recurrence_pattern', eventType.recurrence_pattern || '');
    setValue('target_roles', eventType.target_roles);
    
    if (eventType.default_time) {
      setValue('event_time', eventType.default_time);
    }
    
    // Se tem dia padrão e não estamos editando, calcular próxima data
    if (eventType.default_day !== null && !isEditing) {
      const today = new Date();
      const targetDay = eventType.default_day;
      const daysUntilTarget = (targetDay - today.getDay() + 7) % 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
      setValue('event_date', targetDate.toISOString().split('T')[0]);
    }
    
    setShowTitleDropdown(false);
  };

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    const currentRoles = selectedRoles || [];
    if (checked) {
      setValue('target_roles', [...currentRoles, role]);
    } else {
      setValue('target_roles', currentRoles.filter(r => r !== role));
    }
  };

  const handleSelectAll = () => {
    setValue('target_roles', getAvailableTargetRoles());
  };

  const handleDeselectAll = () => {
    setValue('target_roles', []);
  };

  // Obter roles disponíveis para o usuário atual (pode atribuir para si mesmo e funções abaixo)
  const getAvailableTargetRoles = (): UserRole[] => {
    if (!currentUser) return [];
    
    return getAvailableEventTargetRoles(currentUser.role);
  };

  // Verificar se pode criar tipos de eventos
  const canCreateEventTypes = () => {
    if (!currentUser) return false;
    return EVENT_TYPE_CREATOR_ROLES.includes(currentUser.role);
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      setLoading(true);

      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const eventData = {
        title: data.title,
        description: data.description || null,
        event_date: data.event_date,
        event_time: data.event_time,
        is_recurring: data.is_recurring,
        recurrence_pattern: data.is_recurring ? data.recurrence_pattern : null,
        target_roles: data.target_roles,
        created_by: currentUser.id,
      };

      if (isEditing && event) {
        await eventService.update(event.id, eventData);
        toast.success('Evento atualizado com sucesso!');
      } else {
        await eventService.create(eventData);
        toast.success('Evento criado com sucesso!');
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(error.message || 'Erro ao salvar evento');
    } finally {
      setLoading(false);
    }
  };

  const availableTargetRoles = getAvailableTargetRoles();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? 'Editar Evento' : 'Novo Evento'}
              </h3>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Atualize as informações do evento' : 'Preencha os dados do novo evento'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Título do Evento *
                </label>
                {canCreateEventTypes() && (
                  <button
                    type="button"
                    onClick={() => setShowEventTypesManager(true)}
                    className="text-xs text-primary-600 hover:text-primary-800 flex items-center"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Gerenciar Tipos
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  {...register('title', { required: 'Título é obrigatório' })}
                  type="text"
                  className="input-primary pr-10"
                  placeholder="Digite o título ou selecione um tipo"
                  onClick={() => setShowTitleDropdown(true)}
                />
                <button
                  type="button"
                  onClick={() => setShowTitleDropdown(!showTitleDropdown)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                {showTitleDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setValue('title', '');
                          setValue('description', '');
                          setValue('event_time', '');
                          setValue('is_recurring', false);
                          setValue('recurrence_pattern', '');
                          setValue('target_roles', []);
                          setShowTitleDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                      >
                        Evento Personalizado
                      </button>
                    </div>
                    {eventTypes.map((eventType) => (
                      <button
                        key={eventType.id}
                        type="button"
                        onClick={() => handleEventTypeSelect(eventType)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{eventType.name}</div>
                          {eventType.default_time && (
                            <div className="text-xs text-gray-500">{eventType.default_time}</div>
                          )}
                        </div>
                        {eventType.is_recurring && (
                          <span className="text-xs bg-secondary-100 text-secondary-800 px-2 py-1 rounded">
                            Recorrente
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="input-primary"
                placeholder="Descreva o evento (opcional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data *
              </label>
              <DateInput
                value={eventDate}
                onChange={(value) => setValue('event_date', value)}
                required
                error={errors.event_date?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário *
              </label>
              <TimeInput
                value={eventTime}
                onChange={(value) => setValue('event_time', value)}
                required
                error={errors.event_time?.message}
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <input
                  {...register('is_recurring')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Evento recorrente
                </label>
              </div>

              {isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Padrão de Recorrência
                  </label>
                  <select
                    {...register('recurrence_pattern')}
                    className="input-primary"
                  >
                    <option value="">Selecione o padrão</option>
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quem deverá participar? *
              </label>
              
              <div className="mb-3 flex space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs px-3 py-1 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
                >
                  Todos Disponíveis
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Limpar
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableTargetRoles.map((role) => (
                  <div key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      id={role}
                      checked={selectedRoles?.includes(role) || false}
                      onChange={(e) => handleRoleChange(role, e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor={role} className="ml-2 block text-sm text-gray-900">
                      {ROLE_LABELS[role]}
                    </label>
                  </div>
                ))}
              </div>
              
              {availableTargetRoles.length === 0 && (
                <p className="text-sm text-gray-500">
                  Você não pode atribuir eventos para nenhuma função.
                </p>
              )}
              
              {(!selectedRoles || selectedRoles.length === 0) && availableTargetRoles.length > 0 && (
                <p className="mt-1 text-sm text-red-600">Selecione pelo menos um público alvo</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedRoles || selectedRoles.length === 0}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </form>

        {/* Event Types Manager Modal */}
        {showEventTypesManager && canCreateEventTypes() && (
          <EventTypesList onClose={() => setShowEventTypesManager(false)} />
        )}
      </div>
    </div>
  );
};