import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit, Trash2, UserPlus, UserMinus, Settings, Award, UserCheck, Heart, MapPin, Clock, Calendar, ChevronDown, ChevronRight, CheckSquare, Flame } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { groupService } from '../../services/groupService';
import { userService } from '../../services/userService';
import { memberTrackService } from '../../services/memberTrackService';
import { attendanceService } from '../../services/attendanceService';
import { Group, User, MemberTrack, Attendance, ROLE_LABELS, GROUP_TYPE_LABELS, MEMBER_STATUS_LABELS, DAY_LABELS } from '../../types';
import { toast } from 'react-toastify';
import { GroupForm } from './GroupForm';
import { MemberForm } from '../Users/MemberForm';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

interface HierarchyNode {
  user: User;
  group?: Group;
  subordinates: HierarchyNode[];
  memberTrack?: MemberTrack;
  recentCheckins: Attendance[];
}

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

export const MyGroupPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [memberTracks, setMemberTracks] = useState<MemberTrack[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [hierarchyData, setHierarchyData] = useState<HierarchyNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isEditingMember, setIsEditingMember] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchGroupData();
    }
  }, [currentUser]);

  const fetchGroupData = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Buscar grupo do usuário
      const userGroup = await groupService.getByLeader(currentUser.id);
      setGroup(userGroup);
      
      if (userGroup) {
        // Buscar membros do grupo
        const allUsers = await userService.getAll();
        const groupMembers = allUsers.filter(user => user.group_id === userGroup.id);
        setMembers(groupMembers);
        
        // Buscar trilhos dos membros
        const allTracks = await memberTrackService.getAll();
        const groupMemberTracks = allTracks.filter(track => 
          groupMembers.some(member => member.id === track.user_id)
        );
        setMemberTracks(groupMemberTracks);
        
        // Para líderes superiores, construir hierarquia
        if (currentUser.role !== 'lider_life') {
          await buildHierarchy(allUsers);
        }
        
        // Buscar usuários disponíveis para adicionar ao grupo
        await fetchAvailableUsers(allUsers);
      } else {
        // Se não tem grupo, buscar subordinados para quando criar o grupo
        const allUsers = await userService.getAll();
        await fetchAvailableUsers(allUsers);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast.error('Erro ao carregar dados do grupo');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async (allUsers: User[]) => {
    if (!currentUser) return;

    let available: User[] = [];

    if (currentUser.role === 'lider_life') {
      // Para líderes de life: buscar membros que têm ele como líder direto
      // Incluir tanto membros ativos quanto inativos no sistema
      available = allUsers.filter(user => 
        user.role === 'membro_life' && 
        user.superior_id === currentUser.id &&
        !user.group_id // Não está em nenhum grupo ainda
      );
    } else {
      // Para outros líderes: lógica anterior
      const subordinateRoles = getSubordinateRoles(currentUser.role);
      available = allUsers.filter(user => 
        subordinateRoles.includes(user.role) && 
        user.superior_id === currentUser.id &&
        !user.group_id &&
        user.is_active
      );
    }

    setAvailableUsers(available);
  };

  const buildHierarchy = async (allUsers: User[]) => {
    if (!currentUser) return;

    const allTracks = await memberTrackService.getAll();
    const allAttendance = await attendanceService.getAll();
    
    // Buscar subordinados diretos
    const directSubordinates = allUsers.filter(user => 
      user.superior_id === currentUser.id && user.is_active
    );

    const hierarchy: HierarchyNode[] = [];

    for (const subordinate of directSubordinates) {
      const node = await buildHierarchyNode(subordinate, allUsers, allTracks, allAttendance);
      hierarchy.push(node);
    }

    setHierarchyData(hierarchy);
  };

  const buildHierarchyNode = async (user: User, allUsers: User[], allTracks: MemberTrack[], allAttendance: Attendance[]): Promise<HierarchyNode> => {
    // Buscar grupo do usuário
    const userGroup = await groupService.getByLeader(user.id);
    
    // Buscar trilho se for membro
    const memberTrack = allTracks.find(track => track.user_id === user.id);
    
    // Buscar check-ins recentes (últimos 5)
    const userCheckins = allAttendance
      .filter(att => att.user_id === user.id && att.status === 'present' && att.checked_in_at)
      .sort((a, b) => new Date(b.checked_in_at!).getTime() - new Date(a.checked_in_at!).getTime())
      .slice(0, 5);

    // Buscar subordinados recursivamente
    const subordinates: HierarchyNode[] = [];
    const directSubordinates = allUsers.filter(u => u.superior_id === user.id && u.is_active);
    
    for (const subordinate of directSubordinates) {
      const subNode = await buildHierarchyNode(subordinate, allUsers, allTracks, allAttendance);
      subordinates.push(subNode);
    }

    return {
      user,
      group: userGroup || undefined,
      subordinates,
      memberTrack,
      recentCheckins: userCheckins
    };
  };

  const toggleNodeExpansion = (userId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderHierarchyNode = (node: HierarchyNode, level: number = 0) => {
    const hasSubordinates = node.subordinates.length > 0;
    const isExpanded = expandedNodes.has(node.user.id);
    const indentClass = `ml-${level * 6}`;

    return (
      <div key={node.user.id} className="border border-gray-200 rounded-lg mb-4">
        {/* Cabeçalho do Nó */}
        <div className={`p-4 ${level > 0 ? 'bg-gray-50' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {hasSubordinates && (
                <button
                  onClick={() => toggleNodeExpansion(node.user.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              )}
              
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium">
                  {node.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {node.user.name} {node.user.last_name}
                </h3>
                <p className="text-sm text-gray-500">{ROLE_LABELS[node.user.role]}</p>
                {node.group && (
                  <p className="text-sm text-blue-600">
                    {GROUP_TYPE_LABELS[node.group.type]}: {node.group.name}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600">
                {hasSubordinates && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {node.subordinates.length} subordinado(s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Informações Expandidas */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Informações Básicas */}
            <div className="bg-white p-3 rounded border">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Informações</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Email:</strong> {node.user.email}</p>
                {node.user.phone && (
                  <p>
                    <strong>Telefone:</strong> 
                    <a
                      href={`https://wa.me/55${node.user.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-800 ml-1"
                    >
                      {node.user.phone}
                    </a>
                  </p>
                )}
                <p><strong>Status:</strong> {MEMBER_STATUS_LABELS[node.user.member_status]}</p>
                {node.user.birth_date && (
                  <p><strong>Aniversário:</strong> {formatDate(node.user.birth_date)}</p>
                )}
              </div>
            </div>

            {/* Trilho (apenas para membros) */}
            {node.user.role === 'membro_life' && node.memberTrack && (
              <div className="bg-white p-3 rounded border">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Trilho</h4>
                <div className="space-y-1 text-xs">
                  {node.memberTrack.discipulado && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 mr-1 mb-1">
                      <Award className="h-3 w-3 mr-1" />
                      Discipulado
                    </span>
                  )}
                  {node.memberTrack.batizado && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 mr-1 mb-1">
                      <Heart className="h-3 w-3 mr-1" />
                      Batizado
                    </span>
                  )}
                  {node.memberTrack.is_discipulador && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800 mr-1 mb-1">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Discipulador
                    </span>
                  )}
                  {node.memberTrack.equipe_lideranca && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-800 mr-1 mb-1">
                      <Flame className="h-3 w-3 mr-1" />
                      Liderança
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Check-ins Recentes */}
            <div className="bg-white p-3 rounded border">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Check-ins Recentes</h4>
              {node.recentCheckins.length === 0 ? (
                <p className="text-xs text-gray-500">Nenhum check-in recente</p>
              ) : (
                <div className="space-y-1">
                  {node.recentCheckins.map((checkin, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-600">
                      <CheckSquare className="h-3 w-3 text-green-600 mr-1" />
                      <span>{formatDateTime(checkin.checked_in_at!)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Informações do Grupo */}
          {node.group && (
            <div className="mt-4 bg-blue-50 p-3 rounded border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                {GROUP_TYPE_LABELS[node.group.type]}: {node.group.name}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                {node.group.description && (
                  <p><strong>Descrição:</strong> {node.group.description}</p>
                )}
                {node.group.meeting_day !== null && node.group.meeting_time && (
                  <p>
                    <strong>Reuniões:</strong> {DAY_LABELS[node.group.meeting_day]} às {node.group.meeting_time}
                  </p>
                )}
                {node.group.address && (
                  <p><strong>Endereço:</strong> {node.group.address}</p>
                )}
                <p><strong>Criado em:</strong> {formatDate(node.group.created_at)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Subordinados */}
        {hasSubordinates && isExpanded && (
          <div className="border-t border-gray-200 p-4 bg-gray-25">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Subordinados</h4>
            <div className="space-y-2">
              {node.subordinates.map(subNode => renderHierarchyNode(subNode, level + 1))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getSubordinateRoles = (role: string) => {
    switch (role) {
      case 'pastor_rede':
        return ['lider_area'];
      case 'lider_area':
        return ['lider_setor'];
      case 'lider_setor':
        return ['lider_life'];
      case 'lider_life':
        return ['membro_life'];
      default:
        return [];
    }
  };

  const getGroupType = (role: string) => {
    switch (role) {
      case 'pastor_rede':
        return 'rede';
      case 'lider_area':
        return 'area';
      case 'lider_setor':
        return 'setor';
      case 'lider_life':
        return 'lifegroup';
      default:
        return 'lifegroup';
    }
  };

  const getGroupTitle = (role: string) => {
    switch (role) {
      case 'pastor_rede':
        return 'Minha Rede';
      case 'lider_area':
        return 'Minha Área';
      case 'lider_setor':
        return 'Meu Setor';
      case 'lider_life':
        return 'Meu Lifegroup';
      default:
        return 'Meu Grupo';
    }
  };

  const getGroupStats = () => {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.member_status === 'ativo').length;
    const consolidationMembers = members.filter(m => m.member_status === 'consolidacao').length;
    const discipuladores = memberTracks.filter(t => t.is_discipulador).length;

    return {
      totalMembers,
      activeMembers,
      consolidationMembers,
      discipuladores
    };
  };

  const handleAddMember = async (userId: string) => {
    if (!group) return;
    
    try {
      await userService.update(userId, { group_id: group.id });
      toast.success('Membro adicionado ao grupo!');
      fetchGroupData();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Erro ao adicionar membro');
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    try {
      await userService.update(selectedMember.id, { group_id: null });
      toast.success('Membro removido do grupo!');
      setShowRemoveConfirm(false);
      setSelectedMember(null);
      fetchGroupData();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Erro ao remover membro');
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    
    try {
      // Verificar se o membro foi cadastrado pelo líder atual
      if (selectedMember.superior_id === currentUser?.id) {
        await userService.delete(selectedMember.id);
        toast.success('Membro excluído com sucesso!');
        setShowDeleteConfirm(false);
        setSelectedMember(null);
        fetchGroupData();
      } else {
        toast.error('Você só pode excluir membros que foram cadastrados por você');
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Erro ao excluir membro');
    }
  };

  const handleEditMember = (member: User) => {
    setSelectedMember(member);
    setIsEditingMember(true);
    setShowMemberForm(true);
  };

  const handleDeleteGroup = async () => {
    if (!group) return;
    if (!window.confirm(`Você tem certeza que deseja excluir o grupo "${group.name}"? Todos os membros serão removidos.`)) return;
    
    try {
      // Remover todos os membros do grupo
      for (const member of members) {
        await userService.update(member.id, { group_id: null });
      }
      
      // Excluir o grupo
      await groupService.delete(group.id);
      toast.success('Grupo excluído com sucesso!');
      setGroup(null);
      fetchGroupData();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Erro ao excluir grupo');
    }
  };

  const canDeleteMember = (member: User) => {
    return currentUser?.role === 'lider_life' && member.superior_id === currentUser.id;
  };

  const canEditMember = (member: User) => {
    return currentUser?.role === 'lider_life' && member.superior_id === currentUser.id;
  };

  const isLeadershipTeam = (memberId: string) => {
    const memberTrack = memberTracks.find(t => t.user_id === memberId);
    return memberTrack?.equipe_lideranca === true;
  };

  if (!currentUser) {
    return <div>Carregando...</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  const stats = getGroupStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGroupTitle(currentUser.role)}
          </h1>
          <p className="text-sm text-gray-500">
            {group ? `Gerencie seu ${GROUP_TYPE_LABELS[group.type].toLowerCase()}` : 'Crie e gerencie seu grupo'}
          </p>
        </div>
        
        {!group ? (
          <button
            onClick={() => setShowGroupForm(true)}
            className="btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar {GROUP_TYPE_LABELS[getGroupType(currentUser.role)]}
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowGroupForm(true)}
              className="btn-secondary"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </button>
            <button
              onClick={handleDeleteGroup}
              className="btn-secondary text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </button>
          </div>
        )}
      </div>

      {group ? (
        <>
          {/* Informações do Grupo */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                {group.image_url ? (
                  <img
                    src={group.image_url}
                    alt={group.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="bg-primary-100 p-4 rounded-lg">
                    <Users className="h-8 w-8 text-primary-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
                  <p className="text-sm text-gray-500">{GROUP_TYPE_LABELS[group.type]}</p>
                  
                  {/* Informações de reunião para lifegroups */}
                  {group.type === 'lifegroup' && group.meeting_day !== null && group.meeting_time && (
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {DAY_LABELS[group.meeting_day]}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {group.meeting_time}
                      </div>
                    </div>
                  )}
                  
                  {/* Endereço para lifegroups */}
                  {group.type === 'lifegroup' && group.address && (
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {group.address}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4">
              {group.description && (
                <p className="text-gray-600 mb-4">{group.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{stats.totalMembers}</div>
                  <div className="text-sm text-gray-500">Total de Membros</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.activeMembers}</div>
                  <div className="text-sm text-gray-500">Membros Ativos</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.consolidationMembers}</div>
                  <div className="text-sm text-gray-500">Em Consolidação</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.discipuladores}</div>
                  <div className="text-sm text-gray-500">Discipuladores</div>
                </div>
              </div>
            </div>
          </div>

          {/* Visualização Hierárquica para Líderes Superiores */}
          {currentUser.role !== 'lider_life' && hierarchyData.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Hierarquia Completa</h3>
                <p className="text-sm text-gray-500">
                  Visualização em cascata de toda sua hierarquia
                </p>
              </div>
              
              <div className="p-6">
                {hierarchyData.map(node => renderHierarchyNode(node))}
              </div>
            </div>
          )}

          {/* Membros do Grupo - Para Líderes de Life */}
          {currentUser.role === 'lider_life' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Membros do Grupo</h3>
                  <button
                    onClick={() => {
                      setSelectedMember(null);
                      setIsEditingMember(false);
                      setShowMemberForm(true);
                    }}
                    className="btn-primary text-sm"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Membro
                  </button>
                </div>
              </div>
              
              <div className="px-6 py-4">
                {members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum membro no grupo</p>
                    <button
                      onClick={() => {
                        setSelectedMember(null);
                        setIsEditingMember(false);
                        setShowMemberForm(true);
                      }}
                      className="mt-4 btn-primary text-sm"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar Primeiro Membro
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => {
                      const memberTrack = memberTracks.find(t => t.user_id === member.id);
                      const isLeadership = isLeadershipTeam(member.id);
                      
                      return (
                        <div 
                          key={member.id} 
                          className={`border rounded-lg p-4 transition-all ${
                            isLeadership 
                              ? 'border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 shadow-md' 
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                isLeadership ? 'bg-orange-100' : 'bg-primary-100'
                              }`}>
                                <span className={`font-medium ${
                                  isLeadership ? 'text-orange-600' : 'text-primary-600'
                                }`}>
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <p className={`text-sm font-medium ${
                                    isLeadership ? 'text-orange-900' : 'text-gray-900'
                                  }`}>
                                    {member.name} {member.last_name}
                                  </p>
                                  {isLeadership && (
                                    <Flame className="h-4 w-4 text-orange-500 ml-2" title="Equipe de Liderança" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{ROLE_LABELS[member.role]}</p>
                                {member.phone && (
                                  <a
                                    href={`https://wa.me/55${member.phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-green-600 hover:text-green-800"
                                  >
                                    {member.phone}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              {canEditMember(member) && (
                                <button
                                  onClick={() => handleEditMember(member)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Editar membro"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => {
                                  setSelectedMember(member);
                                  setShowRemoveConfirm(true);
                                }}
                                className="text-orange-600 hover:text-orange-800 p-1"
                                title="Remover do grupo"
                              >
                                <UserMinus className="h-4 w-4" />
                              </button>
                              
                              {canDeleteMember(member) && (
                                <button
                                  onClick={() => {
                                    setSelectedMember(member);
                                    setShowDeleteConfirm(true);
                                  }}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Excluir membro"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Status:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                member.member_status === 'ativo' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {MEMBER_STATUS_LABELS[member.member_status]}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Acesso:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                member.is_active 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {member.is_active ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                            
                            {memberTrack && (
                              <div className="flex flex-wrap gap-1 text-xs">
                                {memberTrack.is_discipulador && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                                    <Award className="h-3 w-3 mr-1" />
                                    Discipulador
                                  </span>
                                )}
                                {memberTrack.equipe_lideranca && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                                    <Flame className="h-3 w-3 mr-1" />
                                    Liderança
                                  </span>
                                )}
                                {memberTrack.batizado && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-800">
                                    <Heart className="h-3 w-3 mr-1" />
                                    Batizado
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {member.birth_date && (
                              <div className="text-xs text-gray-500">
                                Aniversário: {formatDate(member.birth_date)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Usuários Disponíveis para Adicionar */}
          {availableUsers.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {currentUser.role === 'lider_life' ? 'Membros Disponíveis' : 'Adicionar Membros'}
                </h3>
                <p className="text-sm text-gray-500">
                  {currentUser.role === 'lider_life' 
                    ? 'Membros que têm você como líder direto e podem ser adicionados ao seu lifegroup'
                    : 'Usuários subordinados que podem ser adicionados ao grupo'
                  }
                </p>
              </div>
              
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableUsers.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.name} {user.last_name}
                            </p>
                            <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
                            <p className="text-xs text-gray-500">
                              {MEMBER_STATUS_LABELS[user.member_status]}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.is_active ? 'Acesso Ativo' : 'Acesso Inativo'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddMember(user.id)}
                          className="text-primary-600 hover:text-primary-800 p-1"
                          title="Adicionar ao grupo"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Estado sem grupo */
        <div className="text-center py-12">
          <div className="bg-white shadow rounded-lg p-8">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Você ainda não tem um {GROUP_TYPE_LABELS[getGroupType(currentUser.role)].toLowerCase()}
            </h3>
            <p className="text-gray-500 mb-6">
              Crie seu {GROUP_TYPE_LABELS[getGroupType(currentUser.role)].toLowerCase()} para organizar e gerenciar seus membros
            </p>
            <button
              onClick={() => setShowGroupForm(true)}
              className="btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar {GROUP_TYPE_LABELS[getGroupType(currentUser.role)]}
            </button>
          </div>
        </div>
      )}

      {/* Modal de Formulário de Grupo */}
      {showGroupForm && (
        <GroupForm
          group={group}
          groupType={getGroupType(currentUser.role)}
          onClose={() => setShowGroupForm(false)}
          onSuccess={() => {
            setShowGroupForm(false);
            fetchGroupData();
          }}
        />
      )}

      {/* Modal de Formulário de Membro - apenas para líderes de life */}
      {showMemberForm && currentUser.role === 'lider_life' && (
        <MemberForm
          user={selectedMember}
          isEditing={isEditingMember}
          onClose={() => {
            setShowMemberForm(false);
            setSelectedMember(null);
            setIsEditingMember(false);
          }}
          onSuccess={() => {
            setShowMemberForm(false);
            setSelectedMember(null);
            setIsEditingMember(false);
            fetchGroupData();
          }}
        />
      )}

      {/* Modal de Confirmação para Remover do Grupo */}
      {showRemoveConfirm && selectedMember && (
        <ConfirmModal
          title="Remover do Grupo"
          message={`Tem certeza que deseja remover ${selectedMember.name} ${selectedMember.last_name} do grupo? O membro continuará no sistema, mas não estará mais associado a este grupo.`}
          confirmText="Remover"
          cancelText="Cancelar"
          onConfirm={handleRemoveMember}
          onCancel={() => {
            setShowRemoveConfirm(false);
            setSelectedMember(null);
          }}
        />
      )}

      {/* Modal de Confirmação para Excluir Membro */}
      {showDeleteConfirm && selectedMember && (
        <ConfirmModal
          title="Excluir Membro"
          message={`Tem certeza que deseja excluir permanentemente ${selectedMember.name} ${selectedMember.last_name}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          onConfirm={handleDeleteMember}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedMember(null);
          }}
          isDelete={true}
        />
      )}
    </div>
  );
};