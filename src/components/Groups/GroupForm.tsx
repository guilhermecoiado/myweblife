import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Users, MapPin, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { groupService } from '../../services/groupService';
import { eventService } from '../../services/eventService';
import { Group, GROUP_TYPE_LABELS, DAY_LABELS } from '../../types';
import { toast } from 'react-toastify';
import { TimeInput } from '../common/TimeInput';
import { ImageUpload } from '../common/ImageUpload';

interface GroupFormProps {
  group?: Group | null;
  groupType: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface GroupFormData {
  name: string;
  description: string;
  image_url: string;
  meeting_day: number | null;
  meeting_time: string;
  address: string;
  cep: string;
}

export const GroupForm: React.FC<GroupFormProps> = ({ group, groupType, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<GroupFormData>({
    defaultValues: {
      name: group?.name || '',
      description: group?.description || '',
      image_url: group?.image_url || '',
      meeting_day: group?.meeting_day ?? null,
      meeting_time: group?.meeting_time || '',
      address: group?.address || '',
      cep: group?.cep || '',
    },
  });

  const meetingDay = watch('meeting_day');
  const meetingTime = watch('meeting_time');
  const imageUrl = watch('image_url');

  const handleCepChange = async (cep: string) => {
    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
          setValue('address', fullAddress);
          toast.success('Endereço encontrado automaticamente!');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const onSubmit = async (data: GroupFormData) => {
    try {
      setLoading(true);

      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Geocodificar endereço se fornecido
      let latitude = null;
      let longitude = null;
      
      if (data.address) {
        try {
          // Usar um serviço de geocodificação (aqui simulamos)
          // Em produção, você usaria Google Maps API ou similar
          const mockCoords = {
            latitude: -23.5505 + (Math.random() - 0.5) * 0.1,
            longitude: -46.6333 + (Math.random() - 0.5) * 0.1
          };
          latitude = mockCoords.latitude;
          longitude = mockCoords.longitude;
        } catch (error) {
          console.error('Erro ao geocodificar endereço:', error);
        }
      }

      const groupData = {
        name: data.name,
        description: data.description || null,
        type: groupType as any,
        leader_id: currentUser.id,
        image_url: data.image_url || null,
        meeting_day: data.meeting_day,
        meeting_time: data.meeting_time || null,
        address: data.address || null,
        cep: data.cep || null,
        latitude,
        longitude,
        is_active: true,
      };

      let savedGroup: Group;

      if (group) {
        savedGroup = await groupService.update(group.id, groupData);
        toast.success('Grupo atualizado com sucesso!');
      } else {
        savedGroup = await groupService.create(groupData);
        toast.success('Grupo criado com sucesso!');
        
        // Se é lifegroup e tem dia/horário, criar evento recorrente
        if (groupType === 'lifegroup' && data.meeting_day !== null && data.meeting_time) {
          try {
            // Calcular próxima data do dia da semana
            const today = new Date();
            const targetDay = data.meeting_day;
            const daysUntilTarget = (targetDay - today.getDay() + 7) % 7;
            const nextMeetingDate = new Date(today);
            nextMeetingDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
            
            await eventService.create({
              title: `Lifegroup - ${data.name}`,
              description: `Reunião do lifegroup ${data.name}`,
              event_date: nextMeetingDate.toISOString().split('T')[0],
              event_time: data.meeting_time,
              is_recurring: true,
              recurrence_pattern: 'weekly',
              target_roles: ['lider_life', 'membro_life'],
              created_by: currentUser.id,
            });
            
            toast.success('Evento recorrente criado automaticamente!');
          } catch (eventError) {
            console.error('Erro ao criar evento:', eventError);
            toast.warning('Grupo criado, mas houve erro ao criar o evento recorrente');
          }
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving group:', error);
      toast.error(error.message || 'Erro ao salvar grupo');
    } finally {
      setLoading(false);
    }
  };

  const formatCep = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 8) {
      return cleanValue.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {group ? 'Editar' : 'Criar'} {GROUP_TYPE_LABELS[groupType]}
              </h3>
              <p className="text-sm text-gray-500">
                {group ? 'Atualize as informações do seu grupo' : 'Crie seu grupo para organizar seus membros'}
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
          {/* Informações Básicas */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Informações Básicas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do {GROUP_TYPE_LABELS[groupType]} *
                </label>
                <input
                  {...register('name', { required: 'Nome é obrigatório' })}
                  type="text"
                  className="input-primary"
                  placeholder={`Ex: ${GROUP_TYPE_LABELS[groupType]} Central`}
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
                  placeholder="Descreva o propósito e objetivos do grupo (opcional)"
                />
              </div>
            </div>
          </div>

          {/* Imagem do Grupo */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Imagem do {GROUP_TYPE_LABELS[groupType]}</h4>
            <ImageUpload
              value={imageUrl}
              onChange={(url) => setValue('image_url', url)}
              placeholder={`Adicione uma imagem para o ${GROUP_TYPE_LABELS[groupType].toLowerCase()}`}
              maxSize={3}
            />
          </div>

          {/* Dia e Horário - Apenas para Lifegroups */}
          {groupType === 'lifegroup' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-4 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Dia e Horário das Reuniões
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dia da Semana
                  </label>
                  <select
                    {...register('meeting_day', { valueAsNumber: true })}
                    className="input-primary"
                  >
                    <option value="">Selecione o dia</option>
                    {Object.entries(DAY_LABELS).map(([value, label]) => (
                      <option key={value} value={Number(value)}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário
                  </label>
                  <TimeInput
                    value={meetingTime}
                    onChange={(value) => setValue('meeting_time', value)}
                  />
                </div>
              </div>
              
              {meetingDay !== null && meetingTime && (
                <div className="mt-3 p-3 bg-blue-100 rounded-md">
                  <p className="text-sm text-blue-800">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    <strong>Evento automático:</strong> Será criado um evento recorrente semanal 
                    "{`Lifegroup - ${watch('name') || 'Seu Lifegroup'}`}" 
                    toda {DAY_LABELS[meetingDay]} às {meetingTime}.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Endereço - Apenas para Lifegroups */}
          {groupType === 'lifegroup' && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="text-sm font-medium text-green-900 mb-4 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Localização do Lifegroup
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP *
                  </label>
                  <input
                    {...register('cep', { 
                      required: 'CEP é obrigatório para lifegroups',
                      pattern: {
                        value: /^\d{5}-?\d{3}$/,
                        message: 'CEP inválido'
                      }
                    })}
                    type="text"
                    className="input-primary"
                    placeholder="00000-000"
                    maxLength={9}
                    onChange={(e) => {
                      const formatted = formatCep(e.target.value);
                      setValue('cep', formatted);
                      if (formatted.length === 9) {
                        handleCepChange(formatted);
                      }
                    }}
                  />
                  {errors.cep && (
                    <p className="mt-1 text-sm text-red-600">{errors.cep.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço Completo *
                  </label>
                  <input
                    {...register('address', { required: 'Endereço é obrigatório para lifegroups' })}
                    type="text"
                    className="input-primary"
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-green-100 rounded-md">
                <p className="text-sm text-green-800">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  <strong>Importante:</strong> O endereço será usado para que líderes superiores 
                  possam localizar e filtrar lifegroups por região no mapa.
                </p>
              </div>
            </div>
          )}

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
              disabled={loading}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : (group ? 'Atualizar' : 'Criar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};