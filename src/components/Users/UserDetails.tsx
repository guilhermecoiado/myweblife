import React from 'react';
import { X, Edit, Mail, Phone, Calendar, User as UserIcon, Shield } from 'lucide-react';
import { User, ROLE_LABELS } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

interface UserDetailsProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
}

export const UserDetails: React.FC<UserDetailsProps> = ({ user, onClose, onEdit }) => {
  const { user: currentUser } = useAuth();

  const canEdit = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    // Adicionar lógica de hierarquia aqui se necessário
    return false;
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    // Adiciona o código do país (55 para Brasil) se não estiver presente
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${fullPhone}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-medium text-lg">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Detalhes do Usuário
              </h3>
              <p className="text-sm text-gray-500">
                Informações completas do usuário
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
          {/* Informações Básicas */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <UserIcon className="h-4 w-4 mr-2" />
              Informações Básicas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome Completo
                </label>
                <p className="mt-1 text-sm text-gray-900">{user.name} {user.last_name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </label>
                <div className="mt-1 flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
              </div>
              {user.phone && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </label>
                  <div className="mt-1 flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <a
                      href={formatPhoneForWhatsApp(user.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-800 transition-colors"
                      title="Abrir WhatsApp"
                    >
                      {user.phone}
                    </a>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acesso
                </label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active 
                      ? 'bg-success-100 text-success-800' 
                      : 'bg-error-100 text-error-800'
                  }`}>
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hierarquia */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Hierarquia
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </label>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Líder Direto
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.superior_id ? 'Definido' : 'Nenhum líder direto'}
                </p>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Datas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.birth_date && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Aniversário
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(user.birth_date)}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateTime(user.created_at)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última atualização
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateTime(user.updated_at)}
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