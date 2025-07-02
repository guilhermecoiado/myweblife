import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Settings, User as UserIcon, Lock, Palette, Save, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { User } from '../../types';
import { toast } from 'react-toastify';
import { ImageUpload } from '../common/ImageUpload';
import { DateInput } from '../common/DateInput';

interface SettingsFormData {
  name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date: string;
  profile_photo: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<SettingsFormData>({
    defaultValues: {
      name: user?.name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      birth_date: user?.birth_date || '',
      profile_photo: user?.profile_photo || '',
      current_password: '',
      new_password: '',
      confirm_password: ''
    }
  });

  const newPassword = watch('new_password');
  const confirmPassword = watch('confirm_password');
  const birthDate = watch('birth_date');
  const profilePhoto = watch('profile_photo');

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone || '',
        birth_date: user.birth_date || '',
        profile_photo: user.profile_photo || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    }

    // Verificar tema salvo
    const savedTheme = localStorage.getItem('myweblife_theme');
    setDarkMode(savedTheme === 'dark');
    applyTheme(savedTheme === 'dark');
  }, [user, reset]);

  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('myweblife_theme', newDarkMode ? 'dark' : 'light');
    applyTheme(newDarkMode);
    toast.success(`Tema ${newDarkMode ? 'escuro' : 'claro'} ativado!`);
  };

  const onSubmit = async (data: SettingsFormData) => {
    try {
      setLoading(true);

      // Validar senhas se estiver alterando
      if (showPasswordFields) {
        if (!data.current_password) {
          toast.error('Digite sua senha atual para alterá-la');
          return;
        }
        if (data.new_password !== data.confirm_password) {
          toast.error('As senhas não coincidem');
          return;
        }
        if (data.new_password.length < 6) {
          toast.error('A nova senha deve ter pelo menos 6 caracteres');
          return;
        }
      }

      // Preparar dados para atualização
      const updateData: Partial<User> = {
        name: data.name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        birth_date: data.birth_date || null,
        profile_photo: data.profile_photo || null
      };

      // Se estiver alterando senha, incluir no update
      if (showPasswordFields && data.new_password) {
        // Em um sistema real, você validaria a senha atual no backend
        // Por enquanto, vamos simular que a validação passou
        (updateData as any).password = data.new_password;
      }

      await updateProfile(updateData);
      
      // Limpar campos de senha
      setValue('current_password', '');
      setValue('new_password', '');
      setValue('confirm_password', '');
      setShowPasswordFields(false);

      toast.success('Configurações atualizadas com sucesso!');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error(error.message || 'Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
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
            <Settings className="h-8 w-8 text-primary-600 mr-3" />
            Configurações
          </h1>
          <p className="text-sm text-gray-500">
            Gerencie suas informações pessoais e preferências do sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Pessoais */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Informações Pessoais
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Foto de Perfil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto de Perfil
              </label>
              <ImageUpload
                value={profilePhoto}
                onChange={(imageUrl) => setValue('profile_photo', imageUrl)}
                placeholder="Clique para adicionar sua foto de perfil"
                maxSize={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  {...register('name', { required: 'Nome é obrigatório' })}
                  type="text"
                  className="input-primary"
                  placeholder="Digite seu nome"
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
                  placeholder="Digite seu sobrenome"
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
                  placeholder="Digite seu email"
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
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Segurança
              </h2>
              <button
                type="button"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                className="btn-secondary text-sm"
              >
                {showPasswordFields ? 'Cancelar' : 'Alterar Senha'}
              </button>
            </div>
          </div>
          
          {showPasswordFields && (
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Importante:</strong> Para alterar sua senha, você deve fornecer sua senha atual e uma nova senha com pelo menos 6 caracteres.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual *
                  </label>
                  <div className="relative">
                    <input
                      {...register('current_password', { 
                        required: showPasswordFields ? 'Senha atual é obrigatória' : false 
                      })}
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="input-primary pr-10"
                      placeholder="Digite sua senha atual"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.current_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.current_password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha *
                  </label>
                  <div className="relative">
                    <input
                      {...register('new_password', { 
                        required: showPasswordFields ? 'Nova senha é obrigatória' : false,
                        minLength: {
                          value: 6,
                          message: 'Senha deve ter pelo menos 6 caracteres'
                        }
                      })}
                      type={showNewPassword ? 'text' : 'password'}
                      className="input-primary pr-10"
                      placeholder="Digite sua nova senha"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.new_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.new_password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha *
                  </label>
                  <div className="relative">
                    <input
                      {...register('confirm_password', { 
                        required: showPasswordFields ? 'Confirmação de senha é obrigatória' : false,
                        validate: value => value === newPassword || 'As senhas não coincidem'
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="input-primary pr-10"
                      placeholder="Confirme sua nova senha"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Aparência */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Aparência
            </h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Tema do Sistema</h3>
                <p className="text-sm text-gray-500">
                  Escolha entre o tema claro ou escuro
                </p>
              </div>
              <button
                type="button"
                onClick={handleThemeToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  darkMode ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  {darkMode ? (
                    <Moon className="h-3 w-3 text-primary-600 absolute top-1 left-1" />
                  ) : (
                    <Sun className="h-3 w-3 text-gray-400 absolute top-1 left-1" />
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => {
              reset();
              setShowPasswordFields(false);
            }}
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
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};