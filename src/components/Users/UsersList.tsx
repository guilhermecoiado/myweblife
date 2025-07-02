import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, UserCheck, UserX, Users as UsersIcon, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { groupService } from '../../services/groupService';
import { User, Group, ROLE_LABELS, ROLE_HIERARCHY, MEMBER_STATUS_LABELS } from '../../types';
import { toast } from 'react-toastify';
import { UserForm } from './UserForm';
import { MemberForm } from './MemberForm';
import { UserDetails } from './UserDetails';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDelete?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isDelete = false
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="btn-secondary"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn-primary ${isDelete ? 'bg-red-600 hover:bg-red-700' : ''}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const UsersList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [showLeaderForm, setShowLeaderForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, groupsData] = await Promise.all([
        userService.getAll(),
        groupService.getAll()
      ]);
      
      // Filtrar usuários baseado na hierarquia
      const filteredUsers = getHierarchicalUsers(usersData);
      setUsers(filteredUsers);
      setGroups(groupsData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Função para filtrar usuários baseado na hierarquia
  const getHierarchicalUsers = (allUsers: User[]): User[] => {
    if (!currentUser) return [];

    // Superadmin vê todos (exceto outros superadmins)
    if (currentUser.role === 'superadmin') {
      return allUsers.filter(u => u.role !== 'superadmin');
    }

    const hierarchicalUsers: User[] = [];
    
    // Adicionar o próprio usuário
    hierarchicalUsers.push(currentUser);
    
    // Buscar subordinados recursivamente
    const findSubordinates = (userId: string, targetRoles: string[]) => {
      const directSubordinates = allUsers.filter(u => 
        u.superior_id === userId && 
        targetRoles.includes(u.role) &&
        u.is_active
      );
      
      hierarchicalUsers.push(...directSubordinates);
      
      // Recursivamente buscar subordinados dos subordinados
      directSubordinates.forEach(subordinate => {
        if (subordinate.role === 'pastor_rede') {
          findSubordinates(subordinate.id, ['lider_area', 'lider_setor', 'lider_life', 'membro_life']);
        } else if (subordinate.role === 'lider_area') {
          findSubordinates(subordinate.id, ['lider_setor', 'lider_life', 'membro_life']);
        } else if (subordinate.role === 'lider_setor') {
          findSubordinates(subordinate.id, ['lider_life', 'membro_life']);
        } else if (subordinate.role === 'lider_life') {
          findSubordinates(subordinate.id, ['membro_life']);
        }
      });
    };

    // Definir quais roles cada função pode ver
    switch (currentUser.role) {
      case 'pastor_rede':
        findSubordinates(currentUser.id, ['lider_area', 'lider_setor', 'lider_life', 'membro_life']);
        break;
      case 'lider_area':
        findSubordinates(currentUser.id, ['lider_setor', 'lider_life', 'membro_life']);
        break;
      case 'lider_setor':
        findSubordinates(currentUser.id, ['lider_life', 'membro_life']);
        break;
      case 'lider_life':
        findSubordinates(currentUser.id, ['membro_life']);
        break;
      default:
        // Membros só veem a si mesmos
        break;
    }

    // Remover duplicatas e manter apenas usuários únicos
    const uniqueUsers = hierarchicalUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );

    return uniqueUsers;
  };

  // Obter roles disponíveis para filtro baseado na hierarquia
  const getAvailableRolesForFilter = (): string[] => {
    if (!currentUser) return [];

    const roles = ['all'];
    
    // Adicionar o próprio role
    roles.push(currentUser.role);

    // Adicionar roles subordinados
    switch (currentUser.role) {
      case 'superadmin':
        roles.push('pastor_rede', 'lider_area', 'lider_setor', 'lider_life', 'membro_life');
        break;
      case 'pastor_rede':
        roles.push('lider_area', 'lider_setor', 'lider_life', 'membro_life');
        break;
      case 'lider_area':
        roles.push('lider_setor', 'lider_life', 'membro_life');
        break;
      case 'lider_setor':
        roles.push('lider_life', 'membro_life');
        break;
      case 'lider_life':
        roles.push('membro_life');
        break;
    }

    return roles;
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const success = await userService.delete(selectedUser.id);
      if (success) {
        toast.success('Usuário excluído com sucesso!');
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        fetchData();
      } else {
        throw new Error('Falha ao excluir usuário');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    
    try {
      await userService.toggleStatus(selectedUser.id, newStatus);
      toast.success(`Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
      setShowStatusConfirm(false);
      setSelectedUser(null);
      fetchData();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error('Erro ao atualizar status do usuário');
    }
  };

  const canManageUser = (user: User) => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    
    // Não pode gerenciar a si mesmo
    if (user.id === currentUser.id) return false;
    
    const currentUserLevel = ROLE_HIERARCHY[currentUser.role];
    const targetUserLevel = ROLE_HIERARCHY[user.role];
    
    // Líderes de life podem gerenciar membros criados por eles
    if (currentUser.role === 'lider_life' && user.role === 'membro_life' && user.superior_id === currentUser.id) {
      return true;
    }
    
    return currentUserLevel < targetUserLevel;
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && user.is_active) ||
                           (statusFilter === 'inactive' && !user.is_active);
      const matchesGroup = groupFilter === 'all' || user.group_id === groupFilter;
      
      return matchesSearch && matchesRole && matchesStatus && matchesGroup;
    });
  };

  const filteredUsers = getFilteredUsers();
  const availableRoles = getAvailableRolesForFilter();

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditing(true);
    if (user.role === 'membro_life') {
      setShowMemberForm(true);
    } else {
      setShowLeaderForm(true);
    }
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowDetails(true);
  };

  const handleCloseForm = () => {
    setShowLeaderForm(false);
    setShowMemberForm(false);
    setSelectedUser(null);
    setIsEditing(false);
    fetchData();
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedUser(null);
  };

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return 'Sem grupo';
    const group = groups.find(g => g.id === groupId);
    return group ? group.name : 'Grupo não encontrado';
  };

  const getLeaderName = (superiorId: string | null) => {
    if (!superiorId) return 'Sem líder direto';
    const leader = users.find(u => u.id === superiorId);
    return leader ? `${leader.name} ${leader.last_name}` : 'Líder não encontrado';
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove todos os caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    // Adiciona o código do país (55 para Brasil) se não estiver presente
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    return `https://wa.me/${fullPhone}`;
  };

  // Verificar se pode adicionar líderes ou membros
  const canAddLeaders = () => {
    if (!currentUser) return false;
    return ROLE_HIERARCHY[currentUser.role] <= 3; // Até líder de setor
  };

  const canAddMembers = () => {
    if (!currentUser) return false;
    return currentUser.role === 'lider_life';
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Líderes/Membros</h1>
          <p className="text-sm text-gray-500">
            Gerencie sua hierarquia de liderança
          </p>
        </div>
        <div className="flex space-x-2">
          {canAddMembers() && (
            <button
              onClick={() => setShowMemberForm(true)}
              className="btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Membro
            </button>
          )}
          {canAddLeaders() && (
            <button
              onClick={() => setShowLeaderForm(true)}
              className="btn-secondary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Líder
            </button>
          )}
        </div>
      </div>

      {/* Informação sobre visualização hierárquica */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <UsersIcon className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Visualização Hierárquica:</strong> Você está vendo apenas usuários da sua hierarquia.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Inclui: seu perfil + funções subordinadas diretas e indiretas sob sua liderança.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-primary pl-10"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-primary"
          >
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role === 'all' ? 'Todas as funções' : ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-primary"
          >
            <option value="all">Todos os acessos</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>

          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="input-primary"
          >
            <option value="all">Todos os grupos</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>

          <div className="flex items-center text-sm text-gray-500">
            <Filter className="h-4 w-4 mr-2" />
            {filteredUsers.length} usuário(s) encontrado(s)
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Líder Direto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acesso
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 ${user.id === currentUser?.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        user.id === currentUser?.id ? 'bg-blue-100' : 'bg-primary-100'
                      }`}>
                        <span className={`font-medium ${
                          user.id === currentUser?.id ? 'text-blue-600' : 'text-primary-600'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name} {user.last_name}
                          </div>
                          {user.id === currentUser?.id && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        {user.role === 'membro_life' && (
                          <div className="text-xs text-gray-500">
                            {MEMBER_STATUS_LABELS[user.member_status]}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getLeaderName(user.superior_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.phone ? (
                      <a
                        href={formatPhoneForWhatsApp(user.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-green-600 hover:text-green-800 transition-colors"
                        title="Abrir WhatsApp"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        {user.phone}
                      </a>
                    ) : (
                      <span className="text-gray-400">Sem telefone</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-error-100 text-error-800'
                    }`}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleView(user)}
                        className="text-gray-600 hover:text-gray-900 p-1"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {canManageUser(user) && (
                        <>
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-primary-600 hover:text-primary-900 p-1"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setNewStatus(!user.is_active);
                              setShowStatusConfirm(true);
                            }}
                            className={`p-1 ${user.is_active ? 'text-warning-600 hover:text-warning-900' : 'text-success-600 hover:text-success-900'}`}
                            title={user.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-error-600 hover:text-error-900 p-1"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nenhum usuário encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou adicionar novos usuários</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showLeaderForm && (
        <UserForm
          user={selectedUser}
          isEditing={isEditing}
          onClose={handleCloseForm}
          onSuccess={handleCloseForm}
        />
      )}

      {showMemberForm && (
        <MemberForm
          user={selectedUser}
          isEditing={isEditing}
          onClose={handleCloseForm}
          onSuccess={handleCloseForm}
        />
      )}

      {showDetails && selectedUser && (
        <UserDetails
          user={selectedUser}
          onClose={handleCloseDetails}
          onEdit={() => {
            handleCloseDetails();
            handleEdit(selectedUser);
          }}
        />
      )}

      {/* Modal de Confirmação para Excluir Usuário */}
      {showDeleteConfirm && selectedUser && (
        <ConfirmModal
          title="Excluir Usuário"
          message={`Tem certeza que deseja excluir permanentemente ${selectedUser.name} ${selectedUser.last_name}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={handleDeleteUser}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedUser(null);
          }}
          isDelete={true}
        />
      )}

      {/* Modal de Confirmação para Alterar Status */}
      {showStatusConfirm && selectedUser && (
        <ConfirmModal
          title={newStatus ? "Ativar Usuário" : "Desativar Usuário"}
          message={`Tem certeza que deseja ${newStatus ? 'ativar' : 'desativar'} ${selectedUser.name} ${selectedUser.last_name}?`}
          confirmText={newStatus ? "Ativar" : "Desativar"}
          cancelText="Cancelar"
          onConfirm={handleToggleStatus}
          onCancel={() => {
            setShowStatusConfirm(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};