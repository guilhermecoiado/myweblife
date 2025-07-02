import React, { useState, useEffect } from 'react';
import { Network, Users, Edit, Trash2, Plus, MapPin, Building, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { groupService } from '../../services/groupService';
import { userService } from '../../services/userService';
import { Group, User, GROUP_TYPE_LABELS, ROLE_LABELS } from '../../types';
import { toast } from 'react-toastify';

export const AllGroupsPage: React.FC = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allGroups, allUsers] = await Promise.all([
        groupService.getAll(),
        userService.getAll()
      ]);
      
      setGroups(allGroups);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'rede':
        return Network;
      case 'area':
        return MapPin;
      case 'setor':
        return Building;
      case 'lifegroup':
        return UserCheck;
      default:
        return Users;
    }
  };

  const getGroupLeader = (leaderId: string) => {
    return users.find(u => u.id === leaderId);
  };

  const getGroupMembersCount = (groupId: string) => {
    return users.filter(u => u.group_id === groupId).length;
  };

  const handleViewGroup = (group: Group) => {
    setSelectedGroup(group);
    const members = users.filter(u => u.group_id === group.id);
    setGroupMembers(members);
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`Você tem certeza que deseja excluir o grupo "${groupName}"? Todos os membros serão removidos.`)) return;
    
    try {
      // Remover todos os membros do grupo
      const members = users.filter(u => u.group_id === groupId);
      for (const member of members) {
        await userService.update(member.id, { group_id: null });
      }
      
      // Excluir o grupo
      await groupService.delete(groupId);
      toast.success('Grupo excluído com sucesso!');
      fetchData();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Erro ao excluir grupo');
    }
  };

  const getGroupStats = () => {
    const stats = {
      totalGroups: groups.length,
      redes: groups.filter(g => g.type === 'rede').length,
      areas: groups.filter(g => g.type === 'area').length,
      setores: groups.filter(g => g.type === 'setor').length,
      lifegroups: groups.filter(g => g.type === 'lifegroup').length,
      totalMembers: users.filter(u => u.group_id).length
    };
    return stats;
  };

  const stats = getGroupStats();

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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Network className="h-8 w-8 text-primary-600 mr-3" />
            Todos os Grupos
          </h1>
          <p className="text-sm text-gray-500">
            Visualização completa de todas as redes, áreas, setores e lifegroups
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-primary-600">{stats.totalGroups}</div>
          <div className="text-sm text-gray-500">Total de Grupos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.redes}</div>
          <div className="text-sm text-gray-500">Redes</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">{stats.areas}</div>
          <div className="text-sm text-gray-500">Áreas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.setores}</div>
          <div className="text-sm text-gray-500">Setores</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.lifegroups}</div>
          <div className="text-sm text-gray-500">Lifegroups</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-secondary-600">{stats.totalMembers}</div>
          <div className="text-sm text-gray-500">Membros</div>
        </div>
      </div>

      {/* Lista de Grupos */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Todos os Grupos</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grupo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Líder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membros
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groups.map((group) => {
                const GroupIcon = getGroupIcon(group.type);
                const leader = getGroupLeader(group.leader_id);
                const membersCount = getGroupMembersCount(group.id);
                
                return (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <GroupIcon className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {group.name}
                          </div>
                          {group.description && (
                            <div className="text-sm text-gray-500">
                              {group.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {GROUP_TYPE_LABELS[group.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {leader ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {leader.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ROLE_LABELS[leader.role]}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Sem líder</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {membersCount} membro(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(group.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewGroup(group)}
                          className="text-primary-600 hover:text-primary-900 p-1"
                          title="Visualizar"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id, group.name)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {groups.length === 0 && (
          <div className="text-center py-12">
            <Network className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">Nenhum grupo encontrado</p>
            <p className="text-sm text-gray-500">Os grupos criados pelos líderes aparecerão aqui</p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Grupo */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-3 rounded-lg">
                  {React.createElement(getGroupIcon(selectedGroup.type), {
                    className: "h-6 w-6 text-primary-600"
                  })}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedGroup.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {GROUP_TYPE_LABELS[selectedGroup.type]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="h-6 w-6 transform rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informações do Grupo */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Informações do Grupo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Líder
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {getGroupLeader(selectedGroup.leader_id)?.name || 'Sem líder'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total de Membros
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {groupMembers.length} membro(s)
                    </p>
                  </div>
                  {selectedGroup.description && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descrição
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedGroup.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Membros do Grupo */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Membros do Grupo</h4>
                {groupMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum membro no grupo</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{ROLE_LABELS[member.role]}</p>
                            {member.email && (
                              <p className="text-xs text-gray-500">{member.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedGroup(null)}
                className="btn-secondary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};