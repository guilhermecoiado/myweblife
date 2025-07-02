import React, { useState, useEffect } from 'react';
import { FileText, Send, Clock, CheckCircle, AlertTriangle, Users, Calendar, Plus, Filter, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { weeklyReportService } from '../../services/weeklyReportService';
import { userService } from '../../services/userService';
import { groupService } from '../../services/groupService';
import { WeeklyReport, User, Group, ROLE_LABELS, GROUP_TYPE_LABELS } from '../../types';
import { toast } from 'react-toastify';
import { ReportForm } from './ReportForm';
import { formatDate, formatDateTime, getCurrentWeekDateRange } from '../../utils/dateUtils';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [receivedReports, setReceivedReports] = useState<{ report: WeeklyReport; leader: User; group?: Group }[]>([]);
  const [filteredReports, setFilteredReports] = useState<{ report: WeeklyReport; leader: User; group?: Group }[]>([]);
  const [pendingReports, setPendingReports] = useState<{ leader: User; weekStart: string; weekEnd: string; group?: Group }[]>([]);
  const [myReports, setMyReports] = useState<WeeklyReport[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [hasCurrentWeekReport, setHasCurrentWeekReport] = useState(false);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  
  // Filtros
  const [groupTypeFilter, setGroupTypeFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [leaderFilter, setLeaderFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchReportsData();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [receivedReports, groupTypeFilter, groupFilter, leaderFilter]);

  const fetchReportsData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const [allGroups] = await Promise.all([
        groupService.getAll()
      ]);
      
      setGroups(allGroups);
      
      // Verificar se é líder de life e se já enviou relatório da semana
      if (user.role === 'lider_life') {
        const weekStart = weeklyReportService.getCurrentWeekStart();
        const hasReport = await weeklyReportService.hasReportForWeek(user.id, weekStart);
        setHasCurrentWeekReport(hasReport);
        
        // Buscar meus relatórios
        const myReportsList = await weeklyReportService.getByLeader(user.id);
        setMyReports(myReportsList);
      }
      
      // Verificar se passou do prazo
      setIsDeadlinePassed(weeklyReportService.isReportDeadlinePassed());
      
      // Para líderes superiores, buscar relatórios recebidos e pendentes
      if (user.role !== 'membro_life' && user.role !== 'lider_life') {
        const [received, pending] = await Promise.all([
          weeklyReportService.getReceivedReports(),
          weeklyReportService.getPendingReports()
        ]);
        
        // Filtrar baseado na hierarquia
        const subordinates = weeklyReportService.getSubordinateUsers(user.id, user.role, await userService.getAll());
        const subordinateIds = subordinates.map(s => s.id);
        
        if (user.role === 'superadmin') {
          // Adicionar informações de grupo aos relatórios
          const receivedWithGroups = received.map(r => ({
            ...r,
            group: r.leader.group_id ? allGroups.find(g => g.id === r.leader.group_id) : undefined
          }));
          
          const pendingWithGroups = pending.map(p => ({
            ...p,
            group: p.leader.group_id ? allGroups.find(g => g.id === p.leader.group_id) : undefined
          }));
          
          setReceivedReports(receivedWithGroups);
          setPendingReports(pendingWithGroups);
        } else {
          const filteredReceived = received.filter(r => subordinateIds.includes(r.leader.id));
          const filteredPending = pending.filter(p => subordinateIds.includes(p.leader.id));
          
          const receivedWithGroups = filteredReceived.map(r => ({
            ...r,
            group: r.leader.group_id ? allGroups.find(g => g.id === r.leader.group_id) : undefined
          }));
          
          const pendingWithGroups = filteredPending.map(p => ({
            ...p,
            group: p.leader.group_id ? allGroups.find(g => g.id === p.leader.group_id) : undefined
          }));
          
          setReceivedReports(receivedWithGroups);
          setPendingReports(pendingWithGroups);
        }
      }
      
    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...receivedReports];

    // Filtro por tipo de grupo
    if (groupTypeFilter !== 'all') {
      if (groupTypeFilter === 'no_group') {
        filtered = filtered.filter(r => !r.group);
      } else {
        filtered = filtered.filter(r => r.group?.type === groupTypeFilter);
      }
    }

    // Filtro por grupo específico
    if (groupFilter !== 'all') {
      filtered = filtered.filter(r => r.leader.group_id === groupFilter);
    }

    // Filtro por líder
    if (leaderFilter !== 'all') {
      filtered = filtered.filter(r => r.leader.id === leaderFilter);
    }

    setFilteredReports(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      'Líder',
      'Email',
      'Grupo',
      'Tipo de Grupo',
      'Semana Início',
      'Semana Fim',
      'Membros Fixos',
      'Convidados',
      'Crianças',
      'Observações',
      'Enviado em'
    ];

    const csvData = filteredReports.map(({ report, leader, group }) => [
      `${leader.name} ${leader.last_name}`,
      leader.email,
      group?.name || 'Sem grupo',
      group ? GROUP_TYPE_LABELS[group.type] : 'N/A',
      formatDate(report.week_start_date),
      formatDate(report.week_end_date),
      report.fixed_members_present,
      report.guests_present,
      report.children_present,
      report.observations || '',
      formatDateTime(report.submitted_at)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getWeekDateRange = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const canSendReport = () => {
    return user?.role === 'lider_life' && !hasCurrentWeekReport && !isDeadlinePassed;
  };

  const shouldShowPendingAlert = () => {
    return user?.role === 'lider_life' && !hasCurrentWeekReport;
  };

  // Obter líderes únicos para filtro
  const uniqueLeaders = Array.from(
    new Map(receivedReports.map(r => [r.leader.id, r.leader])).values()
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500">
            {user?.role === 'lider_life' 
              ? 'Envie seus relatórios semanais'
              : 'Acompanhe os relatórios da sua hierarquia'
            }
          </p>
        </div>
        
        <div className="flex space-x-2">
          {(user?.role !== 'membro_life' && user?.role !== 'lider_life') && filteredReports.length > 0 && (
            <button
              onClick={exportToCSV}
              className="btn-secondary"
            >
              <Download className="h-5 w-5 mr-2" />
              Exportar CSV
            </button>
          )}
          
          {canSendReport() && (
            <button
              onClick={() => setShowReportForm(true)}
              className="btn-primary"
            >
              <Send className="h-5 w-5 mr-2" />
              Enviar Relatório
            </button>
          )}
        </div>
      </div>

      {/* Alerta para líder de life com relatório pendente */}
      {shouldShowPendingAlert() && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-red-900">
                Seu relatório está pendente!
              </h3>
              <p className="text-sm text-red-700">
                {isDeadlinePassed 
                  ? 'O prazo para envio do relatório semanal já passou (domingo meio-dia).'
                  : `Você precisa enviar o relatório semanal até domingo meio-dia. Semana: ${getCurrentWeekDateRange()}`
                }
              </p>
              {!isDeadlinePassed && (
                <button
                  onClick={() => setShowReportForm(true)}
                  className="mt-2 btn-primary text-sm"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Enviar Agora
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Informações para líderes de life */}
      {user?.role === 'lider_life' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-blue-900">
                Relatório Semanal
              </h3>
              <p className="text-sm text-blue-700">
                Todo lifegroup deve preencher 1 relatório por semana, até domingo meio-dia.
              </p>
              <div className="mt-2 text-sm text-blue-600">
                <p><strong>Semana atual:</strong> {getCurrentWeekDateRange()}</p>
                <p><strong>Status:</strong> {hasCurrentWeekReport ? '✅ Enviado' : '⏳ Pendente'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meus Relatórios (para líderes de life) */}
      {user?.role === 'lider_life' && myReports.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Meus Relatórios</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {myReports.slice(0, 5).map((report) => (
              <div key={report.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      Semana: {getWeekDateRange(report.week_start_date, report.week_end_date)}
                    </h3>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Membros Fixos:</span> {report.fixed_members_present}
                      </div>
                      <div>
                        <span className="font-medium">Convidados:</span> {report.guests_present}
                      </div>
                      <div>
                        <span className="font-medium">Crianças:</span> {report.children_present}
                      </div>
                    </div>
                    {report.observations && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Observações:</span> {report.observations}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                      Enviado
                    </div>
                    <div className="mt-1">
                      {formatDateTime(report.submitted_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relatórios Recebidos (para líderes superiores) */}
      {(user?.role !== 'membro_life' && user?.role !== 'lider_life') && (
        <>
          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                {groups.filter(g => g.type === 'lifegroup').map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>

              <select
                value={leaderFilter}
                onChange={(e) => setLeaderFilter(e.target.value)}
                className="input-primary"
              >
                <option value="all">Todos os líderes</option>
                {uniqueLeaders.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.name} {leader.last_name}
                  </option>
                ))}
              </select>

              <div className="flex items-center text-sm text-gray-500">
                <Filter className="h-4 w-4 mr-2" />
                {filteredReports.length} relatório(s)
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Relatórios Recebidos</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    {filteredReports.length} recebido(s)
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-orange-600 mr-1" />
                    {pendingReports.length} pendente(s)
                  </div>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredReports.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Nenhum relatório encontrado</p>
                  <p className="text-sm">Ajuste os filtros ou aguarde novos relatórios</p>
                </div>
              ) : (
                filteredReports.map(({ report, leader, group }) => (
                  <div key={report.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {leader.name} {leader.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {ROLE_LABELS[leader.role]} • {group ? `${group.name} (${GROUP_TYPE_LABELS[group.type]})` : 'Sem grupo'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Semana: {getWeekDateRange(report.week_start_date, report.week_end_date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="font-medium">{report.fixed_members_present}</div>
                              <div className="text-xs text-gray-500">Membros</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{report.guests_present}</div>
                              <div className="text-xs text-gray-500">Convidados</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium">{report.children_present}</div>
                              <div className="text-xs text-gray-500">Crianças</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Enviado em {formatDateTime(report.submitted_at)}
                        </div>
                      </div>
                    </div>
                    {report.observations && (
                      <div className="mt-3 pl-14">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Observações:</span> {report.observations}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Relatórios Pendentes */}
          {pendingReports.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
                  Relatórios Pendentes
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {pendingReports.map(({ leader, weekStart, weekEnd, group }) => (
                  <div key={leader.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {leader.name} {leader.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {ROLE_LABELS[leader.role]} • {group ? `${group.name} (${GROUP_TYPE_LABELS[group.type]})` : 'Sem grupo'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Semana: {getWeekDateRange(weekStart, weekEnd)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-orange-600">
                          Relatório Pendente
                        </div>
                        <div className="text-xs text-gray-500">
                          {isDeadlinePassed ? 'Prazo vencido' : 'Prazo: Domingo meio-dia'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Formulário de Relatório */}
      {showReportForm && (
        <ReportForm
          onClose={() => setShowReportForm(false)}
          onSuccess={() => {
            setShowReportForm(false);
            fetchReportsData();
            toast.success('Relatório enviado com sucesso!');
          }}
        />
      )}
    </div>
  );
};