import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, MessageSquare, Image, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Palette, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { userService } from '../../services/userService';
import { User, UserRole, ROLE_LABELS, EVENT_TARGET_ROLES } from '../../types';
import { toast } from 'react-toastify';

interface NotificationFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface NotificationFormData {
  title: string;
  message: string;
  image_url: string;
  target_type: 'roles' | 'users' | 'all';
  target_roles: UserRole[];
  target_users: string[];
}

export const NotificationForm: React.FC<NotificationFormProps> = ({ onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<NotificationFormData>({
    defaultValues: {
      title: '',
      message: '',
      image_url: '',
      target_type: 'all',
      target_roles: [],
      target_users: [],
    },
  });

  const targetType = watch('target_type');
  const selectedRoles = watch('target_roles');
  const selectedUsers = watch('target_users');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const allUsers = await userService.getAll();
      setUsers(allUsers.filter(u => u.is_active));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    const currentRoles = selectedRoles || [];
    if (checked) {
      setValue('target_roles', [...currentRoles, role]);
    } else {
      setValue('target_roles', currentRoles.filter(r => r !== role));
    }
  };

  const handleUserChange = (userId: string, checked: boolean) => {
    const currentUsers = selectedUsers || [];
    if (checked) {
      setValue('target_users', [...currentUsers, userId]);
    } else {
      setValue('target_users', currentUsers.filter(u => u !== userId));
    }
  };

  const handleSelectAllRoles = () => {
    setValue('target_roles', [...EVENT_TARGET_ROLES]);
  };

  const handleDeselectAllRoles = () => {
    setValue('target_roles', []);
  };

  const handleSelectAllUsers = () => {
    setValue('target_users', users.map(u => u.id));
  };

  const handleDeselectAllUsers = () => {
    setValue('target_users', []);
  };

  // Funções de formatação de texto
  const formatText = (command: string, value?: string) => {
    if (!messageRef.current) return;
    
    const textarea = messageRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    
    switch (command) {
      case 'bold':
        formattedText = `**${selectedText || 'texto em negrito'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'texto em itálico'}*`;
        break;
      case 'color':
        formattedText = `<span style="color: ${value}">${selectedText || 'texto colorido'}</span>`;
        break;
      case 'align-left':
        formattedText = `<div style="text-align: left">${selectedText || 'texto alinhado à esquerda'}</div>`;
        break;
      case 'align-center':
        formattedText = `<div style="text-align: center">${selectedText || 'texto centralizado'}</div>`;
        break;
      case 'align-right':
        formattedText = `<div style="text-align: right">${selectedText || 'texto alinhado à direita'}</div>`;
        break;
    }
    
    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    setValue('message', newValue);
    
    // Reposicionar cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  // Upload de imagem
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Imagem muito grande. Máximo 5MB.');
        return;
      }
      
      setImageFile(file);
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        setValue('image_url', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setValue('image_url', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: NotificationFormData) => {
    try {
      setLoading(true);

      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }

      let targetRoles: UserRole[] = [];
      let targetUsers: string[] = [];

      if (data.target_type === 'all') {
        targetRoles = EVENT_TARGET_ROLES;
        targetUsers = [];
      } else if (data.target_type === 'roles') {
        targetRoles = data.target_roles;
        targetUsers = [];
      } else {
        targetRoles = [];
        targetUsers = data.target_users;
      }

      await notificationService.create({
        title: data.title,
        message: data.message,
        image_url: data.image_url || null,
        target_roles: targetRoles,
        target_users: targetUsers,
        created_by: currentUser.id,
        is_read: false,
        type: 'message',
      });

      toast.success('Notificação enviada com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating notification:', error);
      toast.error(error.message || 'Erro ao enviar notificação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-secondary-100 p-2 rounded-lg">
              <MessageSquare className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Nova Notificação
              </h3>
              <p className="text-sm text-gray-500">
                Envie uma mensagem para os membros
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              {...register('title', { required: 'Título é obrigatório' })}
              type="text"
              className="input-primary"
              placeholder="Digite o título da notificação"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensagem *
            </label>
            
            {/* Barra de ferramentas de formatação */}
            <div className="border border-gray-300 rounded-t-md bg-gray-50 p-2 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => formatText('bold')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Negrito"
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => formatText('italic')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Itálico"
              >
                <Italic className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <button
                type="button"
                onClick={() => formatText('align-left')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Alinhar à esquerda"
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => formatText('align-center')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Centralizar"
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => formatText('align-right')}
                className="p-1 hover:bg-gray-200 rounded"
                title="Alinhar à direita"
              >
                <AlignRight className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center space-x-1">
                <Palette className="h-4 w-4 text-gray-500" />
                <input
                  type="color"
                  onChange={(e) => formatText('color', e.target.value)}
                  className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                  title="Cor do texto"
                />
              </div>
            </div>
            
            <textarea
              {...register('message', { required: 'Mensagem é obrigatória' })}
              ref={messageRef}
              rows={6}
              className="input-primary rounded-t-none border-t-0"
              placeholder="Digite a mensagem (use **texto** para negrito, *texto* para itálico)"
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagem
            </label>
            
            <div className="space-y-4">
              {/* Upload de arquivo */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Anexar Imagem
                </button>
              </div>

              {/* OU */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-sm text-gray-500">OU</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* URL da imagem */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Image className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('image_url')}
                  type="url"
                  className="input-primary pl-10"
                  placeholder="https://exemplo.com/imagem.jpg"
                  onChange={(e) => {
                    if (e.target.value) {
                      setImagePreview(e.target.value);
                      setImageFile(null);
                    }
                  }}
                />
              </div>

              {/* Preview da imagem */}
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-32 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Destinatários *
            </label>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    {...register('target_type')}
                    type="radio"
                    value="all"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">Todos</span>
                </label>
                <label className="flex items-center">
                  <input
                    {...register('target_type')}
                    type="radio"
                    value="roles"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">Por Função</span>
                </label>
                <label className="flex items-center">
                  <input
                    {...register('target_type')}
                    type="radio"
                    value="users"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">Usuários Específicos</span>
                </label>
              </div>

              {targetType === 'roles' && (
                <div>
                  <div className="mb-3 flex space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllRoles}
                      className="text-xs px-3 py-1 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
                    >
                      Todas as Funções
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllRoles}
                      className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {EVENT_TARGET_ROLES.map((role) => (
                      <div key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`role-${role}`}
                          checked={selectedRoles?.includes(role) || false}
                          onChange={(e) => handleRoleChange(role, e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`role-${role}`} className="ml-2 block text-sm text-gray-900">
                          {ROLE_LABELS[role]}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {targetType === 'users' && (
                <div>
                  <div className="mb-3 flex space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllUsers}
                      className="text-xs px-3 py-1 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200"
                    >
                      Todos os Usuários
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllUsers}
                      className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Limpar
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                    <div className="space-y-2">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`user-${user.id}`}
                            checked={selectedUsers?.includes(user.id) || false}
                            onChange={(e) => handleUserChange(user.id, e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`user-${user.id}`} className="ml-2 block text-sm text-gray-900">
                            {user.name} - {ROLE_LABELS[user.role]}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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
              disabled={loading}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar Notificação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};