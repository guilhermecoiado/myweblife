import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, User as UserIcon, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { memberTrackService } from '../../services/memberTrackService';
import { groupService } from '../../services/groupService';
import { User, TrackStatus, MEMBER_STATUS_LABELS } from '../../types';
import { toast } from 'react-toastify';
import { TrackFieldButton } from './TrackFieldButton';
import { DateInput } from '../common/DateInput';

interface MemberFormProps {
  user?: User | null;
  isEditing?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MemberFormData {
  name: string;
  last_name: string;
  email: string;
  password: string;
  superior_id: string;
  phone: string;
  birth_date: string;
  member_status: 'ativo' | 'consolidacao';
  is_active: boolean;
  // Trilho fields
  fill_track: boolean;
  discipulado: TrackStatus;
  discipulado_por: string;
  equipe_lideranca: TrackStatus;
  is_discipulador: TrackStatus;
  batizado: TrackStatus;
  pizza_com_pastor: TrackStatus;
  estacao_dna: TrackStatus;
  nova_criatura: TrackStatus;
  acompanhamento_inicial: TrackStatus;
  expresso_1: TrackStatus;
  expresso_2: TrackStatus;
  voluntario: TrackStatus;
}

export const MemberForm: React.FC<MemberFormProps> = ({ user, isEditing = false, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [superiors, setSuperiors] = useState<User[]>([]);
  const [showTrackFields, setShowTrackFields] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [trackData, setTrackData] = useState<{
    discipulado: TrackStatus;
    discipulado_por: string;
    equipe_lideranca: TrackStatus;
    is_discipulador: TrackStatus;
    batizado: TrackStatus;
    pizza_com_pastor: TrackStatus;
    estacao_dna: TrackStatus;
    nova_criatura: TrackStatus;
    acompanhamento_inicial: TrackStatus;
    expresso_1: TrackStatus;
    expresso_2: TrackStatus;
    voluntario: TrackStatus;
  }>({
    discipulado: false,
    discipulado_por: '',
    equipe_lideranca: false,
    is_discipulador: false,
    batizado: false,
    pizza_com_pastor: false,
    estacao_dna: false,
    nova_criatura: false,
    acompanhamento_inicial: false,
    expresso_1: false,
    expresso_2: false,
    voluntario: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<MemberFormData>({
    defaultValues: {
      name: user?.name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      password: '',
      superior_id: user?.superior_id || currentUser?.id || '',
      phone: user?.phone || '',
      birth_date: user?.birth_date || '',
      member_status: user?.member_status || 'ativo',
      is_active: user?.is_active ?? true,
      fill_track: false,
      ...trackData,
    },
  });

  const fillTrack = watch('fill_track');
  const isActive = watch('is_active');
  const superiorId = watch('superior_id');
  const birthDate = watch('birth_date');

  useEffect(() => {
    fetchSuperiors();
    if (isEditing && user?.role === 'membro_life') {
      loadExistingTrack();
    }
  }, [user]);

  useEffect(() => {
    setShowTrackFields(fillTrack);
  }, [fillTrack]);

  const loadExistingTrack = async () => {
    if (!user) return;
    
    try {
      const existingTrack = await memberTrackService.getByUserId(user.id);
      if (existingTrack) {
        const newTrackData = {
          discipulado: existingTrack.discipulado,
          discipulado_por: existingTrack.discipulado_por || '',
          equipe_lideranca: existingTrack.equipe_lideranca,
          is_discipulador: existingTrack.is_discipulador,
          batizado: existingTrack.batizado,
          pizza_com_pastor: existingTrack.pizza_com_pastor,
          estacao_dna: existingTrack.estacao_dna,
          nova_criatura: existingTrack.nova_criatura,
          acompanhamento_inicial: existingTrack.acompanhamento_inicial,
          expresso_1: existingTrack.expresso_1,
          expresso_2: existingTrack.expresso_2,
          voluntario: existingTrack.voluntario,
        };
        setTrackData(newTrackData);
        setValue('fill_track', true);
        setShowTrackFields(true);
      }
    } catch (error) {
      console.error('Error loading existing track:', error);
    }
  };

  const fetchSuperiors = async () => {
    try {
      const allUsers = await userService.getAll();
      // Para membros, podem ter como superior: líderes de life, setor, área, rede (sem superadmin)
      const availableSuperiors = allUsers.filter(u => 
        ['pastor_rede', 'lider_area', 'lider_setor', 'lider_life'].includes(u.role) && 
        u.is_active
      );
      
      setSuperiors(availableSuperiors);
    } catch (error: any) {
      console.error('Error fetching superiors:', error);
    }
  };

  const handleTrackFieldChange = (field: keyof typeof trackData, value: TrackStatus) => {
    setTrackData(prev => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (data: MemberFormData) => {
    try {
      setLoading(true);

      // Buscar grupo do líder direto
      let groupId = null;
      if (data.superior_id) {
        try {
          const leader = await userService.getById(data.superior_id);
          if (leader) {
            // Buscar grupo do líder
            const leaderGroup = await groupService.getByLeader(leader.id);
            if (leaderGroup) {
              groupId = leaderGroup.id;
              console.log('Grupo encontrado para o líder:', leaderGroup.name, 'ID:', groupId);
            } else {
              console.log('Líder não possui grupo ainda');
            }
          }
        } catch (error) {
          console.error('Erro ao buscar grupo do líder:', error);
        }
      }

      const userData = {
        name: data.name,
        last_name: data.last_name,
        role: 'membro_life' as const,
        superior_id: data.superior_id || null,
        phone: data.phone || null,
        birth_date: data.birth_date || null,
        member_status: data.member_status,
        is_active: data.is_active,
        group_id: groupId, // Atribuir ao grupo do líder
        profile_photo: null,
        // Incluir email apenas se o usuário estiver ativo
        ...(data.is_active && { email: data.email }),
      };

      let savedUser: User;

      if (isEditing && user) {
        savedUser = await userService.update(user.id, userData);
        toast.success('Membro atualizado com sucesso!');
      } else {
        // Para novos membros, incluir senha se fornecida e usuário ativo
        const newUserData = {
          ...userData,
          ...(data.is_active && data.password && { password: data.password }),
          // Email é obrigatório apenas se o usuário estiver ativo
          ...(data.is_active && { email: data.email }),
        };
        savedUser = await userService.create(newUserData);
        
        // Log para debug
        console.log('Membro criado:', savedUser.name, 'Grupo ID:', savedUser.group_id);
        
        toast.success('Membro criado com sucesso!');
      }

      // Se preencheu trilho, criar/atualizar trilho
      if (data.fill_track) {
        const finalTrackData = {
          user_id: savedUser.id,
          ...trackData,
          discipulado_por: trackData.discipulado && trackData.discipulado_por ? trackData.discipulado_por : null,
        };

        try {
          if (isEditing) {
            await memberTrackService.updateByUserId(savedUser.id, finalTrackData);
          } else {
            await memberTrackService.create(finalTrackData);
          }
        } catch (trackError) {
          console.error('Error saving track:', trackError);
          toast.warning('Membro salvo, mas houve erro ao salvar o trilho');
        }
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving member:', error);
      toast.error(error.message || 'Erro ao salvar membro');
    } finally {
      setLoading(false);
    }
  };

  const trackFields = [
    { key: 'discipulado', label: 'Discipulado' },
    { key: 'equipe_lideranca', label: 'É da Equipe de Liderança' },
    { key: 'is_discipulador', label: 'É Discipulador' },
    { key: 'batizado', label: 'Batizado' },
    { key: 'pizza_com_pastor', label: 'Pizza com Pastor' },
    { key: 'estacao_dna', label: 'Estação DNA' },
    { key: 'nova_criatura', label: 'Nova Criatura' },
    { key: 'acompanhamento_inicial', label: 'Acompanhamento Inicial' },
    { key: 'expresso_1', label: 'Expresso I' },
    { key: 'expresso_2', label: 'Expresso II' },
    { key: 'voluntario', label: 'Voluntário' },
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <UserIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? 'Editar Membro' : 'Adicionar Membro'}
              </h3>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Atualize as informações do membro' : 'Preencha os dados do novo membro'}
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
                  Nome *
                </label>
                <input
                  {...register('name', { required: 'Nome é obrigatório' })}
                  type="text"
                  className="input-primary"
                  placeholder="Digite o nome"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sobrenome *
                </label>
                <input
                  {...register('last_name', { required: 'Sobrenome é obrigatório' })}
                  type="text"
                  className="input-primary"
                  placeholder="Digite o sobrenome"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="input-primary"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Aniversário
                </label>
                <DateInput
                  value={birthDate}
                  onChange={(value) => setValue('birth_date', value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status do Membro
                </label>
                <select
                  {...register('member_status')}
                  className="input-primary"
                >
                  {Object.entries(MEMBER_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status de Acesso
                </label>
                <select
                  {...register('is_active')}
                  className="input-primary"
                  onChange={(e) => setValue('is_active', e.target.value === 'true')}
                >
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </div>
            </div>
          </div>

          {/* Campos de Acesso - Aparecem apenas se Status de Acesso for "Sim" */}
          {isActive && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-4">Informações de Acesso ao Sistema</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email {!isEditing && '*'}
                  </label>
                  <input
                    {...register('email', { 
                      required: !isEditing ? 'Email é obrigatório para acesso ao sistema' : false,
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                    type="email"
                    className="input-primary"
                    placeholder="Digite o email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isEditing ? 'Nova Senha (deixe em branco para manter atual)' : 'Senha *'}
                  </label>
                  <div className="relative">
                    <input
                      {...register('password', { 
                        required: !isEditing ? 'Senha é obrigatória para acesso ao sistema' : false,
                        minLength: {
                          value: 6,
                          message: 'Senha deve ter pelo menos 6 caracteres'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="input-primary pr-10"
                      placeholder={isEditing ? 'Digite nova senha (opcional)' : 'Digite a senha'}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-100 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Informação:</strong> Estes campos são necessários apenas para membros que terão acesso ao sistema.
                </p>
              </div>
            </div>
          )}

          {/* Líder Direto */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Hierarquia</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Líder Direto *
              </label>
              <select
                {...register('superior_id', { required: 'Líder direto é obrigatório' })}
                className="input-primary"
              >
                <option value="">Selecione um líder direto</option>
                {superiors.map((superior) => (
                  <option key={superior.id} value={superior.id}>
                    {superior.name} {superior.last_name} - {superior.role === 'pastor_rede' ? 'Pastor de Rede' : 
                     superior.role === 'lider_area' ? 'Líder de Área' :
                     superior.role === 'lider_setor' ? 'Líder de Setor' :
                     superior.role === 'lider_life' ? 'Líder de Life' : superior.role}
                  </option>
                ))}
              </select>
              {errors.superior_id && (
                <p className="mt-1 text-sm text-red-600">{errors.superior_id.message}</p>
              )}
              <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Atribuição Automática:</strong> O membro será automaticamente adicionado ao grupo do líder selecionado (se o líder possuir um grupo).
                </p>
              </div>
            </div>
          </div>

          {/* Trilho */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Trilho do Membro</h4>
              <button
                type="button"
                onClick={() => {
                  const newValue = !showTrackFields;
                  setShowTrackFields(newValue);
                  setValue('fill_track', newValue);
                }}
                className="flex items-center text-sm text-primary-600 hover:text-primary-800 font-medium"
              >
                Preencher trilho?
                {showTrackFields ? (
                  <ChevronUp className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-1" />
                )}
              </button>
            </div>

            {showTrackFields && (
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h5 className="text-sm font-medium text-gray-900 mb-4">Etapas do Trilho</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trackFields.map((field) => (
                      <div key={field.key}>
                        <TrackFieldButton
                          label={field.label}
                          value={trackData[field.key as keyof typeof trackData]}
                          onChange={(value) => handleTrackFieldChange(field.key as keyof typeof trackData, value)}
                        />
                        
                        {/* Campo do discipulador aparece logo abaixo do Discipulado */}
                        {field.key === 'discipulado' && trackData.discipulado && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nome do Discipulador
                            </label>
                            <input
                              type="text"
                              value={trackData.discipulado_por}
                              onChange={(e) => setTrackData(prev => ({ ...prev, discipulado_por: e.target.value }))}
                              className="input-primary"
                              placeholder="Digite o nome do discipulador"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
              disabled={loading}
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