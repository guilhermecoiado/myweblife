import React, { useState, useEffect } from 'react';
import { Target, Users, CheckCircle, XCircle, Award, TrendingUp, Clock, Filter, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { memberTrackService } from '../../services/memberTrackService';
import { groupService } from '../../services/groupService';
import { User, MemberTrack, TrackStatus, Group, ROLE_LABELS, TRACK_STATUS_LABELS, GROUP_TYPE_LABELS } from '../../types';

interface MemberTrackData {
  user: User;
  track: MemberTrack | null;
  progress: number;
  completedSteps: number;
  inProgressSteps: number;
  totalSteps: number;
  group?: Group;
}

export const TracksPage: React.FC = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tracksData, setTracksData] = useState<MemberTrackData[]>([]);
  const [filteredTracksData, setFilteredTracksData] = useState<MemberTrackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<MemberTrackData | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [groupTypeFilter, setGroupTypeFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<string>('all');

  useEffect(() => {
    fetchTracksData();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [tracksData, searchTerm, groupTypeFilter, groupFilter, progressFilter]);

  const fetchTracksData = async () => {
    try {
      setLoading(true);
      const [allUsers, allGroups] = await Promise.all([
        userService.getAll(),
        groupService.getAll()
      ]);
      
      setGroups(allGroups);
      
      // Filtrar membros baseado na hierarquia
      let visibleMembers: User[] = [];
      
      if (user?.role === 'superadmin') {
        // Superadmin vê todos os membros
        visibleMembers = allUsers.filter(u => u.role === 'membro_life' && u.is_active);
      } else if (user?.role === 'membro_life') {
        // Membros veem apenas a si mesmos
        visibleMembers = allUsers.filter(u => u.id === user.id);
      } else if (user) {
        // Outros líderes veem membros da sua hierarquia
        const subordinates = getSubordinateUsers(user.id, user.role, allUsers);
        visibleMembers = subordinates.filter(u => u.role === 'membro_life');
      }
      
      setMembers(visibleMembers);
      
      const allTracks = await memberTrackService.getAll();
      
      const tracksData = visibleMembers.map(member => {
        const track = allTracks.find(t => t.user_id === member.id);
        const memberGroup = member.group_id ? allGroups.find(g => g.id === member.group_id) : undefined;
        
        if (!track) {
          return {
            user: member,
            track: null,
            progress: 0,
            completedSteps: 0,
            inProgressSteps: 0,
            totalSteps: 11,
            group: memberGroup
          };
        }
        
        const trackSteps = [
          track.discipulado,
          track.equipe_lideranca,
          track.is_discipulador,
          track.batizado,
          track.pizza_com_pastor,
          track.estacao_dna,
          track.nova_criatura,
          track.acompanhamento_inicial,
          track.expresso_1,
          track.expresso_2,
          track.voluntario,
        ];
        
        const completedSteps = trackSteps.filter(step => step === true).length;
        const inProgressSteps = trackSteps.filter(step => step === 'progress').length;
        const totalSteps = trackSteps.length;
        const progress = Math.round(((completedSteps + (inProgressSteps * 0.5)) / totalSteps) * 100);
        
        return {
          user: member,
          track,
          progress,
          completedSteps,
          inProgressSteps,
          totalSteps,
          group: memberGroup
        };
      });
      
      setTracksData(tracksData);
    } catch (error) {
      console.error('Error fetching tracks data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubordinateUsers = (userId: string, userRole: string, allUsers: User[]): User[] => {
    const subordinates: User[] = [];
    
    const addSubordinates = (currentUserId: string, targetRoles: string[]) => {
      const directSubordinates = allUsers.filter(u => 
        u.superior_id === currentUserId && 
        targetRoles.includes(u.role) &&
        u.is_active
      );
      
      subordinates.push(...directSubordinates);
      
      // Recursivamente adicionar subordinados dos subordinados
      directSubordinates.forEach(sub => {
        if (sub.role === 'lider_area') {
          addSubordinates(sub.id, ['lider_setor', 'lider_life', 'membro_life']);
        } else if (sub.role === 'lider_setor') {
          addSubordinates(sub.id, ['lider_life', 'membro_life']);
        } else if (sub.role === 'lider_life') {
          addSubordinates(sub.id, ['membro_life']);
        }
      });
    };
    
    switch (userRole) {
      case 'pastor_rede':
        addSubordinates(userId, ['lider_area', 'lider_setor', 'lider_life', 'membro_life']);
        break;
      case 'lider_area':
        addSubordinates(userId, ['lider_setor', 'lider_life', 'membro_life']);
        break;
      case 'lider_setor':
        addSubordinates(userId, ['lider_life', 'membro_life']);
        break;
      case 'lider_life':
        addSubordinates(userId, ['membro_life']);
        break;
    }
    
    return subordinates;
  };

  const applyFilters = () => {
    let filtered = [...tracksData];

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.group?.name && item.group.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por tipo de grupo
    if (groupTypeFilter !== 'all') {
      if (groupTypeFilter === 'no_group') {
        filtered = filtered.filter(item => !item.group);
      } else {
        filtered = filtered.filter(item => item.group?.type === groupTypeFilter);
      }
    }

    // Filtro por grupo específico
    if (groupFilter !== 'all') {
      filtered = filtered.filter(item => item.user.group_id === groupFilter);
    }

    // Filtro por progresso
    if (progressFilter !== 'all') {
      switch (progressFilter) {
        case 'completed':
          filtered = filtered.filter(item => item.progress === 100);
          break;
        case 'in_progress':
          filtered = filtered.filter(item => item.progress > 0 && item.progress < 100);
          break;
        case 'not_started':
          filtered = filtered.filter(item => item.progress === 0);
          break;
      }
    }

    setFilteredTracksData(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      'Nome',
      'Sobrenome',
      'Email',
      'Grupo',
      'Tipo de Grupo',
      'Progresso (%)',
      'Etapas Concluídas',
      'Etapas em Progresso',
      'Discipulado',
      'Equipe Liderança',
      'É Discipulador',
      'Batizado',
      'Pizza com Pastor',
      'Estação DNA',
      'Nova Criatura',
      'Acompanhamento Inicial',
      'Expresso I',
      'Expresso II',
      'Voluntário'
    ];

    const csvData = filteredTracksData.map(item => [
      item.user.name,
      item.user.last_name,
      item.user.email,
      item.group?.name || 'Sem grupo',
      item.group ? GROUP_TYPE_LABELS[item.group.type] : 'N/A',
      item.progress,
      item.completedSteps,
      item.inProgressSteps,
      item.track?.discipulado ? TRACK_STATUS_LABELS[String(item.track.discipulado)] : 'Não Iniciado',
      item.track?.equipe_lideranca ? TRACK_STATUS_LABELS[String(item.track.equipe_lideranca)] : 'Não Iniciado',
      item.track?.is_discipulador ? TRACK_STATUS_LABELS[String(item.track.is_discipulador)] : 'Não Iniciado',
      item.track?.batizado ? TRACK_STATUS_LABELS[String(item.track.batizado)] : 'Não Iniciado',
      item.track?.pizza_com_pastor ? TRACK_STATUS_LABELS[String(item.track.pizza_com_pastor)] : 'Não Iniciado',
      item.track?.estacao_dna ? TRACK_STATUS_LABELS[String(item.track.estacao_dna)] : 'Não Iniciado',
      item.track?.nova_criatura ? TRACK_STATUS_LABELS[String(item.track.nova_criatura)] : 'Não Iniciado',
      item.track?.acompanhamento_inicial ? TRACK_STATUS_LABELS[String(item.track.acompanhamento_inicial)] : 'Não Iniciado',
      item.track?.expresso_1 ? TRACK_STATUS_LABELS[String(item.track.expresso_1)] : 'Não Iniciado',
      item.track?.expresso_2 ? TRACK_STATUS_LABELS[String(item.track.expresso_2)] : 'Não Iniciado',
      item.track?.voluntario ? TRACK_STATUS_LABELS[String(item.track.voluntario)] : 'Não Iniciado'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trilhos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const trackSteps = [
    { key: 'discipulado', label: 'Discipulado' },
    { key: 'equipe_lideranca', label: 'Equipe de Liderança' },
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

  const getStatusIcon = (status: TrackStatus) => {
    switch (status) {
      case true:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'progress':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case false:
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TrackStatus) => {
    switch (status) {
      case true:
        return 'text-green-900 bg-green-100';
      case 'progress':
        return 'text-orange-900 bg-orange-100';
      case false:
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getTrackStats = () => {
    const totalMembers = filteredTracksData.length;
    const completedTracks = filteredTracksData.filter(t => t.progress === 100).length;
    const inProgress = filteredTracksData.filter(t => t.progress > 0 && t.progress < 100).length;
    const notStarted = filteredTracksData.filter(t => t.progress === 0).length;
    const totalInProgressSteps = filteredTracksData.reduce((sum, t) => sum + t.inProgressSteps, 0);
    const averageProgress = totalMembers > 0 
      ? Math.round(filteredTracksData.reduce((sum, t) => sum + t.progress, 0) / totalMembers)
      : 0;

    return {
      totalMembers,
      completedTracks,
      inProgress,
      notStarted,
      totalInProgressSteps,
      averageProgress
    };
  };

  const stats = getTrackStats();

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
            <Target className="h-8 w-8 text-primary-600 mr-3" />
            {user?.role === 'membro_life' ? 'Meu Trilho' : 'Trilhos dos Membros'}
          </h1>
          <p className="text-sm text-gray-500">
            {user?.role === 'membro_life' 
              ? 'Acompanhe seu desenvolvimento espiritual'
              : 'Acompanhamento do desenvolvimento espiritual dos membros'
            }
          </p>
        </div>
        
        {user?.role !== 'membro_life' && (
          <button
            onClick={exportToCSV}
            className="btn-primary"
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Filtros */}
      {user?.role !== 'membro_life' && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nome ou grupo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-primary"
              />
            </div>
            
            <select
              value={groupTypeFilter}
              onChange={(e) => setGroupTypeFilter(e.target.value)}
              className="input-primary"
            >
              <option value="all">Todos os tipos</option>
              <option value="rede">Rede</option>
              <option value="area">Área</option>
              <option value="setor">Setor</option>
              <option value="lifegroup">Lifegroup</option>
              <option value="no_group">Sem grupo</option>
            </select>

            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="input-primary"
            >
              <option value="all">Todos os grupos</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({GROUP_TYPE_LABELS[group.type]})
                </option>
              ))}
            </select>

            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value)}
              className="input-primary"
            >
              <option value="all">Todos os progressos</option>
              <option value="completed">Completos (100%)</option>
              <option value="in_progress">Em Andamento</option>
              <option value="not_started">Não Iniciados</option>
            </select>

            <div className="flex items-center text-sm text-gray-500">
              <Filter className="h-4 w-4 mr-2" />
              {filteredTracksData.length} membro(s)
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-primary-600">{stats.totalMembers}</div>
          <div className="text-sm text-gray-500">Total de Membros</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completedTracks}</div>
          <div className="text-sm text-gray-500">Trilhos Completos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-500">Em Andamento</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.totalInProgressSteps}</div>
          <div className="text-sm text-gray-500">Etapas em Progresso</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-red-600">{stats.notStarted}</div>
          <div className="text-sm text-gray-500">Não Iniciados</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.averageProgress}%</div>
          <div className="text-sm text-gray-500">Progresso Médio</div>
        </div>
      </div>

      {/* Lista de Trilhos */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {user?.role === 'membro_life' ? 'Meu Progresso' : 'Progresso dos Membros'}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membro
                </th>
                {user?.role !== 'membro_life' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grupo
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progresso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Etapas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTracksData.map((memberTrack) => (
                <tr key={memberTrack.user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-primary-600 font-medium">
                          {memberTrack.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {memberTrack.user.name} {memberTrack.user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {memberTrack.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  {user?.role !== 'membro_life' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {memberTrack.group ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {memberTrack.group.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {GROUP_TYPE_LABELS[memberTrack.group.type]}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Sem grupo</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${memberTrack.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {memberTrack.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {memberTrack.completedSteps} concluídas
                      </span>
                      {memberTrack.inProgressSteps > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {memberTrack.inProgressSteps} em progresso
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {memberTrack.progress === 100 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Award className="h-3 w-3 mr-1" />
                        Completo
                      </span>
                    ) : memberTrack.progress > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Em Andamento
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Não Iniciado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedMember(memberTrack)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTracksData.length === 0 && (
          <div className="text-center py-12">
            <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">Nenhum trilho encontrado</p>
            <p className="text-sm text-gray-500">
              {user?.role === 'membro_life' 
                ? 'Seu trilho será criado automaticamente'
                : 'Os trilhos dos membros aparecerão aqui'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Trilho */}
      {selectedMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-lg">
                    {selectedMember.user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Trilho de {selectedMember.user.name} {selectedMember.user.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Progresso: {selectedMember.progress}% completo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Barra de Progresso */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progresso Geral</span>
                  <span className="text-sm font-medium text-gray-900">{selectedMember.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-primary-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${selectedMember.progress}%` }}
                  ></div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-gray-600">
                  <span>{selectedMember.completedSteps} concluídas</span>
                  <span>{selectedMember.inProgressSteps} em progresso</span>
                  <span>{selectedMember.totalSteps - selectedMember.completedSteps - selectedMember.inProgressSteps} não iniciadas</span>
                </div>
              </div>

              {/* Etapas do Trilho */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Etapas do Trilho</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trackSteps.map((step) => {
                    const value = selectedMember.track?.[step.key as keyof MemberTrack] as TrackStatus;
                    
                    return (
                      <div key={step.key} className={`flex items-center space-x-3 p-3 border border-gray-200 rounded-lg ${getStatusColor(value)}`}>
                        <div className="flex-shrink-0">
                          {getStatusIcon(value)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {step.label}
                          </p>
                          <p className="text-xs">
                            {TRACK_STATUS_LABELS[String(value)] || 'Não Iniciado'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Informações do Discipulado */}
              {selectedMember.track?.discipulado && selectedMember.track?.discipulado_por && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Informações do Discipulado</h4>
                  <p className="text-sm text-blue-700">
                    Discipulador: {selectedMember.track.discipulado_por}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedMember(null)}
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