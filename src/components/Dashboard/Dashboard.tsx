import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { weeklyReportService } from '../../services/weeklyReportService';
import { DashboardStats } from './DashboardStats';
import { RecentEvents } from './RecentEvents';
import { AttendanceChart } from './AttendanceChart';
import { QuickActions } from './QuickActions';
import { ROLE_LABELS } from '../../types';
import { AlertTriangle, Send } from 'lucide-react';
import { ReportForm } from '../Reports/ReportForm';
import { formatDate } from '../../utils/dateUtils';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [showReportAlert, setShowReportAlert] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  useEffect(() => {
    checkReportStatus();
  }, [user]);

  const checkReportStatus = async () => {
    if (!user || user.role !== 'lider_life') return;
    
    try {
      const weekStart = weeklyReportService.getCurrentWeekStart();
      const hasReport = await weeklyReportService.hasReportForWeek(user.id, weekStart);
      const isDeadlinePassed = weeklyReportService.isReportDeadlinePassed();
      
      // Mostrar alerta se não enviou relatório e ainda não passou do prazo
      setShowReportAlert(!hasReport && !isDeadlinePassed);
    } catch (error) {
      console.error('Error checking report status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bem-vindo, {user?.name}!
              </h1>
              <p className="text-sm text-gray-500">
                {user?.role ? ROLE_LABELS[user.role] : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {formatDate(new Date())}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Relatório Pendente para Líderes de Life */}
      {showReportAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-900">
                Seu relatório está pendente!
              </h3>
              <p className="text-sm text-red-700">
                Você precisa enviar o relatório semanal até domingo meio-dia.
              </p>
            </div>
            <button
              onClick={() => setShowReportForm(true)}
              className="btn-primary bg-red-600 hover:bg-red-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Relatório
            </button>
          </div>
        </div>
      )}

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentEvents />
        <QuickActions />
      </div>

      <AttendanceChart />

      {/* Modal de Formulário de Relatório */}
      {showReportForm && (
        <ReportForm
          onClose={() => setShowReportForm(false)}
          onSuccess={() => {
            setShowReportForm(false);
            setShowReportAlert(false);
          }}
        />
      )}
    </div>
  );
};