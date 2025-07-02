import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { User, UserRole, ROLE_LABELS, ROLE_HIERARCHY, MEMBER_STATUS_LABELS } from '../../types';
import { toast } from 'react-toastify';
import { DateInput } from '../common/DateInput';

interface UserFormProps {
  user?: User | null;
  isEditing?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserFormData {
  name: string;
  last_name: string;
  email: string;
  password: string;
  role: UserRole;
  superior_id: string;
  phone: string;
  birth_date: string;
  member_status: 'ativo' | 'consolidacao';
  is_active: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ user, isEditing = false, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [superiors, setSuperiors] = useState<User[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<UserFormData>({
    defaultValues: {
      name: user?.name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'lider_life',
      superior_id: user?.superior_id || '',
      phone: user?.phone || '',
      birth_date: user?.birth_date || '',
      member_status: user?.member_status || 'ativo',
      is_active: user?.is_active ?? true,
    },
  });

  const selectedRole = watch('role');
  const isActive = watch('is_active');
  const birthDate = watch('birth_date');

  useEffect(() => {
    fetchSuperiors();
  }, [selectedRole]);

  const fetchSuperiors = async () => {
    try {
      const superiorRoles = getSuperiorRoles(selectedRole);
      
      if (superiorRoles.length === 0) {
        setSuperiors([]);
        return;
      }

      const allUsers = await userService.getAll();
      // Não mostrar superadmin nas opções
      const availableSuperiors = allUsers.filter(u => 
        superiorRoles.includes(u.role) && 
        u.is_active &&
        u.role !== 'superadmin'
      );
      
      setSuperiors(availableSuperiors);
    } catch (error: any) {
      console.error('Error fetching superiors:', error);
    }
  };

  const getSuperiorRoles = (role: UserRole): UserRole[] => {
    switch (role) {
      case 'pastor_rede':
        return [];
      case 'lider_area':
        return ['pastor_rede'];
      case 'lider_setor':
        return ['pastor_rede', 'lider_area'];
      case 'lider_life':
        return ['pastor_rede', 'lider_area', 'lider_setor'];
      default:
        return [];
    }
  };

  const getAvailableRoles = (): UserRole[] => {
    if (!currentUser) return [];
    
    const currentUserLevel = ROLE_HIERARCHY[currentUser.role];
    
    // Filtrar apenas funções de liderança (não incluir membro_life nem superadmin)
    return Object.keys(ROLE_HIERARCHY).filter(role => {
      const roleLevel = ROLE_HIERARCHY[role as UserRole];
      return roleLevel > currentUserLevel && role !== 'membro_life' && role !== 'superadmin';
    }) as UserRole[];
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);

      const userData = {
        name: data.name,
        last_name: data.last_name,
        email: data.email,
        role: data.role,
        superior_id: data.superior_id || null,
        phone: data.phone || null,
        birth_date: data.birth_date || null,
        member_status: data.member_status,
        is_active: data.is_active,
        profile_photo: null,
      };

      if (isEditing && user) {
        await userService.update(user.id, userData);
        toast.success('Líder atualizado com sucesso!');
      } else {
        // Para novos líderes, incluir senha se fornecida
        const newUserData = {
          ...userData,
          ...(data.password && { password: data.password })
        };
        await userService.create(newUserData);
        toast.success('Líder criado com sucesso!');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Erro ao salvar líder');
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = getAvailableRoles();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <UserIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? 'Editar Líder' : 'Adicionar Líder'}
              </h3>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Atualize as informações do líder' : 'Preencha os dados do novo líder'}
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
                  Email *
                </label>
                <input
                  {...register('email', { 
                    required: 'Email é obrigatório',
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

              {/* Campo Senha - aparece apenas se usuário estiver ativo */}
              {isActive && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isEditing ? 'Nova Senha (deixe em branco para manter atual)' : 'Senha *'}
                  </label>
                  <div className="relative">
                    <input
                      {...register('password', { 
                        required: !isEditing ? 'Senha é obrigatória' : false,
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
              )}
            </div>
          </div>

          {/* Hierarquia */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Hierarquia</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Função *
                </label>
                <select
                  {...register('role', { required: 'Função é obrigatória' })}
                  className="input-primary"
                  onChange={(e) => {
                    setValue('role', e.target.value as UserRole);
                    setValue('superior_id', '');
                  }}
                >
                  <option value="">Selecione uma função</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Líder Direto
                </label>
                <select
                  {...register('superior_id')}
                  className="input-primary"
                  disabled={superiors.length === 0}
                >
                  <option value="">Selecione um líder direto</option>
                  {superiors.map((superior) => (
                    <option key={superior.id} value={superior.id}>
                      {superior.name} {superior.last_name} - {ROLE_LABELS[superior.role]}
                    </option>
                  ))}
                </select>
                {superiors.length === 0 && selectedRole && (
                  <p className="mt-1 text-sm text-gray-500">
                    Nenhum líder direto disponível para esta função
                  </p>
                )}
              </div>
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