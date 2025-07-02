import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { eventTypeService } from '../../services/eventService';
import { EventType, UserRole, ROLE_LABELS, EVENT_TARGET_ROLES, ROLE_HIERARCHY } from '../../types';
import { toast } from 'react-toastify';

interface EventTypeFormProps {
  eventType?: EventType | null;
  isEditing?: boolean;
  onClose: () => void;
}

interface EventTypeFormData {
  name: string;
  description: string;
  default_time: string;
  default_day: number | null;
  is_recurring: boolean;
  recurrence_pattern: string;
  target_roles: UserRole[];
}

export const EventTypeForm: React.FC<EventTypeFormProps> = ({ eventType, isEditing = false, onClose }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<EventTypeFormData>({
    defaultValues: {
      name: eventType?.name || '',
      description: eventType?.description || '',
      default_time: eventType?.default_time || '',
      default_day: eventType?.default_day ?? null,
      is_recurring: eventType?.is_recurring || false,
      recurrence_pattern: eventType?.recurrence_pattern || '',
      target_roles: eventType?.target_roles || [],
    },
  });

  const isRecurring = watch('is_recurring');
  const selectedRoles = watch('target_roles');

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

  // Obter roles disponíveis para o usuário atual
  const getAvailableTargetRoles = (): UserRole[] => {
    if (!currentUser) return [];
    
    const currentUserLevel = ROLE_HIERARCHY[currentUser.role];
    
    // Superadmin pode atribuir para todos (exceto ele mesmo)
    if (currentUser.role === 'superadmin') {
      return EVENT_TARGET_ROLES;
    }
    
    // Outros usuários só podem atribuir para funções abaixo da sua
    return EVENT_TARGET_ROLES.filter(role => {
      const roleLevel = ROLE_HIERARCHY[role];
      return roleLevel > currentUserLevel;
    });
  };

  const onSubmit = async (data: EventTypeFormData) => {
    try {
      setLoading(true);

      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const eventTypeData = {
        name: data.name,
        description: data.description || null,
        default_time: data.default_time || null,
        default_day: data.default_day,
        is_recurring: data.is_recurring,
        recurrence_pattern: data.is_recurring ? data.recurrence_pattern : null,
        target_roles: data.target_roles,
        created_by: currentUser.id,
      };

      if (isEditing && eventType) {
        await eventTypeService.update(eventType.id, eventTypeData);
        toast.success('Tipo de evento atualizado com sucesso!');
      } else {
        await eventTypeService.create(eventTypeData);
        toast.success('Tipo de evento criado com sucesso!');
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving event type:', error);
      toast.error(error.message || 'Erro ao salvar tipo de evento');
    } finally {
      setLoading(false);
    }
  };

  const dayOptions = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
  ];

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
                {isEditing ? 'Editar Tipo de Evento' : 'Novo Tipo de Evento'}
              </h3>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Atualize as informações do tipo de evento' : 'Crie um novo tipo de evento pré-configurado'}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Tipo de Evento *
              </label>
              <input
                {...register('name', { required: 'Nome é obrigatório' })}
                type="text"
                className="input-primary"
                placeholder="Ex: Culto Domingo, Lifegroup, etc."
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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
                placeholder="Descreva o tipo de evento (opcional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horário Padrão
              </label>
              <input
                {...register('default_time')}
                type="time"
                className="input-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dia da Semana Padrão
              </label>
              <select
                {...register('default_day', { valueAsNumber: true })}
                className="input-primary"
              >
                <option value="">Selecione um dia</option>
                {dayOptions.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <input
                  {...register('is_recurring')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Evento recorrente por padrão
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
      </div>
    </div>
  );
};