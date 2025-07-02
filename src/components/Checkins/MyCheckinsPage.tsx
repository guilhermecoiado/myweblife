import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Clock, MapPin, Users, Filter, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceService } from '../../services/attendanceService';
import { eventService } from '../../services/eventService';
import { userService } from '../../services/userService';
import { Attendance, Event, User, ROLE_LABELS } from '../../types';
import { formatDate, formatTime, formatDateTime } from '../../utils/dateUtils';

interface CheckinWithEvent {
  attendance: Attendance;
  event: Event | null;
  user?: User; // Para líderes verem checkins de subordinados
}

export const MyCheckinsPage: React.FC = () => {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<CheckinWithEvent[]>([]);
  const [filteredCheckins, setFilteredCheckins] = useState<CheckinWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Lista de usuários para filtro (apenas para líderes)
  const [subordinateUsers, setSubordinateUsers] = useState<User[]>([]);

  useEffect(() => {
    if (user) {
      fetchCheckins();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [checkins, searchTerm, statusFilter, userFilter, dateFilter]);

  const fetchCheckins = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const [allEvents, allUsers] = await Promise.all([
        eventService.getAll(),
        userService.getAll()
      ]);
      
      let userAttendance: Attendance[] = [];
      let checkinsWithEvents: CheckinWithEvent[] = [];
      
      if (user.role === 'membro_life') {
        // Membros veem apenas seus próprios checkins
        userAttendance = await attendanceService.getByUser(user.id);
        
        checkinsWithEvents = userAttendance
          .filter(att => att.checked_in_at) // Apenas checkins realizados
          .map(attendance => ({
            attendance,
            event: allEvents.find(event => event.id === attendance.event_id) || null
          }));
      } else {
        // Líderes veem seus checkins + checkins de subordinados
        const subordinates = getSubordinateUsers(user.id, user.role, allUsers);
        setSubordinateUsers(subordinates);
        
        // Incluir o próprio usuário na lista
        const allRelevantUsers = [user, ...subordinates];
        
        // Buscar checkins de todos os usuários relevantes
        const allAttendance = await attendanceService.getAll();
        const relevantUserIds = allRelevantUsers.map(u => u.id);
        
        userAttendance = allAttendance.filter(att => 
          relevantUserIds.includes(att.user_id) && att.checked_in_at
        );
        
        checkinsWithEvents = userAttendance.map(attendance => ({
          attendance,
          event: allEvents.find(event => event.id === attendance.event_id) || null,
          user: allRelevantUsers.find(u => u.id === attendance.user_id)
        }));
      }
      
      // Ordenar por data mais recente
      checkinsWithEvents.sort((a, b) => {
        const dateA = new Date(a.attendance.checked_in_at!);
        const dateB = new Date(b.attendance.checked_in_at!);
        return dateB.getTime() - dateA.getTime();
      });
      
      setCheckins(checkinsWithEvents);
    } catch (error) {
      console.error('Error fetching checkins:', error);
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
      case 'superadmin':
        // Superadmin vê todos
        return allUsers.filter(u => u.id !== userId && u.is_active);
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
    let filtered = [...checkins];

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.event?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user?.last_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.attendance.status === statusFilter);
    }

    // Filtro por usuário (apenas para líderes)
    if (userFilter !== 'all') {
      if (userFilter === 'me') {
        filtered = filtered.filter(item => item.attendance.user_id === user?.id);
      } else {
        filtered = filtered.filter(item => item.attendance.user_id === userFilter);
      }
    }

    // Filtro por data
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(item => {
        const checkinDate = new Date(item.attendance.checked_in_at!);
        const checkinDay = new Date(checkinDate.getFullYear(), checkinDate.getMonth(), checkinDate.getDate());
        
        switch (dateFilter) {
          case 'today':
            return checkinDay.getTime() === today.getTime();
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return checkinDay >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return checkinDay >= monthAgo;
          default:
            return true;
        }
      });
    }

    setFilteredCheckins(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      'Data/Hora',
      'Evento',
      'Usuário',
      'Email',
      'Função',
      'Status',
      'Justificativa'
    ];

    const csvData = filteredCheckins.map(item => [
      formatDateTime(item.attendance.checked_in_at!),
      item.event?.title || 'Evento não encontrado',
      item.user ? `${item.user.name} ${item.user.last_name}` : 'Usuário atual',
      item.user?.email || user?.email || '',
      item.user ? ROLE_LABELS[item.user.role] : (user ? ROLE_LABELS[user.role] : ''),
      item.attendance.status === 'present' ? 'Presente' : 
      item.attendance.status === 'justified' ? 'Ausência Justificada' : 'Ausente',
      item.attendance.justification || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `checkins_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCheckinStats = () => {
    const totalCheckins = filteredCheckins.length;
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthCheckins = filteredCheckins.filter(c => 
      new Date(c.attendance.checked_in_at!) >= thisMonth
    ).length;
    
    const thisWeek = new Date();
    const dayOfWeek = thisWeek.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(thisWeek);
    monday.setDate(thisWeek.getDate() + daysToMonday);
    monday.setHours(0, 0, 0, 0);
    
    const thisWeekCheckins = filteredCheckins.filter(c => 
      new Date(c.attendance.checked_in_at!) >= monday
    ).length;

    // Para líderes: estatísticas de subordinados
    const myCheckins = filteredCheckins.filter(c => c.attendance.user_id === user?.id).length;
    const subordinateCheckins = filteredCheckins.filter(c => c.attendance.user_id !== user?.id).length;
    
    return {
      totalCheckins,
      thisMonthCheckins,
      thisWeekCheckins,
      myCheckins,
      subordinateCheckins
    };
  };

  const stats = getCheckinStats();
  const isLeader = user?.role !== 'membro_life';

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
            <CheckSquare className="h-8 w-8 text-primary-600 mr-3" />
            {isLeader ? 'Checkins' : 'Meus Checkins'}
          </h1>
          <p className="text-sm text-gray-500">
            {isLeader 
              ? 'Histórico de check-ins seus e de sua hierarquia'
              : 'Histórico dos seus check-ins em eventos'
            }
          </p>
        </div>
        
        {isLeader && filteredCheckins.length > 0 && (
          <button
            onClick={exportToCSV}
            className="btn-primary"
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Filtros - Apenas para líderes */}
      {isLeader && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por evento ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-primary"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-primary"
            >
              <option value="all">Todos os status</option>
              <option value="present">Presente</option>
              <option value="justified">Ausência Justificada</option>
              <option value="absent">Ausente</option>
            </select>

            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="input-primary"
            >
              <option value="all">Todos os usuários</option>
              <option value="me">Apenas meus checkins</option>
              {subordinateUsers.map((subordinate) => (
                <option key={subordinate.id} value={subordinate.id}>
                  {subordinate.name} {subordinate.last_name}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-primary"
            >
              <option value="all">Todos os períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Última semana</option>
              <option value="month">Último mês</option>
            </select>

            <div className="flex items-center text-sm text-gray-500">
              <Filter className="h-4 w-4 mr-2" />
              {filteredCheckins.length} checkin(s)
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-primary-600">{stats.totalCheckins}</div>
          <div className="text-sm text-gray-500">Total de Check-ins</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">{stats.thisMonthCheckins}</div>
          <div className="text-sm text-gray-500">Este Mês</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.thisWeekCheckins}</div>
          <div className="text-sm text-gray-500">Esta Semana</div>
        </div>
        {isLeader && (
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.subordinateCheckins}</div>
            <div className="text-sm text-gray-500">Subordinados</div>
          </div>
        )}
        {!isLeader && (
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.myCheckins}</div>
            <div className="text-sm text-gray-500">Meus Checkins</div>
          </div>
        )}
      </div>

      {/* Lista de Check-ins */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {isLeader ? 'Histórico de Check-ins da Hierarquia' : 'Histórico de Check-ins'}
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredCheckins.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nenhum check-in encontrado</p>
              <p className="text-sm">
                {isLeader 
                  ? 'Check-ins da sua hierarquia aparecerão aqui'
                  : 'Seus check-ins em eventos aparecerão aqui'
                }
              </p>
            </div>
          ) : (
            filteredCheckins.map(({ attendance, event, user: checkinUser }) => (
              <div key={attendance.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      attendance.status === 'present' ? 'bg-green-100' :
                      attendance.status === 'justified' ? 'bg-orange-100' : 'bg-red-100'
                    }`}>
                      <CheckSquare className={`h-5 w-5 ${
                        attendance.status === 'present' ? 'text-green-600' :
                        attendance.status === 'justified' ? 'text-orange-600' : 'text-red-600'
                      }`} />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {event ? event.title : 'Evento não encontrado'}
                      </h3>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          attendance.status === 'present' ? 'text-green-600' :
                          attendance.status === 'justified' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {attendance.status === 'present' ? 'Check-in realizado' :
                           attendance.status === 'justified' ? 'Ausência justificada' : 'Ausente'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDateTime(attendance.checked_in_at!)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Mostrar usuário para líderes */}
                    {isLeader && checkinUser && (
                      <div className="mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-xs">
                              {checkinUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {checkinUser.name} {checkinUser.last_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({ROLE_LABELS[checkinUser.role]})
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {event && (
                      <>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {event.description}
                          </p>
                        )}
                        
                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(event.event_date)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatTime(event.event_time)}
                          </div>
                          {event.is_recurring && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                              Recorrente
                            </span>
                          )}
                        </div>
                      </>
                    )}

                    {/* Mostrar justificativa se houver */}
                    {attendance.justification && (
                      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-800">
                          <strong>Justificativa:</strong> {attendance.justification}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};