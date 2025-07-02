import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Send, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { weeklyReportService } from '../../services/weeklyReportService';
import { toast } from 'react-toastify';

interface ReportFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ReportFormData {
  fixed_members_present: number;
  guests_present: number;
  children_present: number;
  observations: string;
}

export const ReportForm: React.FC<ReportFormProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormData>({
    defaultValues: {
      fixed_members_present: 0,
      guests_present: 0,
      children_present: 0,
      observations: '',
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    if (!user) return;
    
    try {
      setLoading(true);

      const weekStart = weeklyReportService.getCurrentWeekStart();
      const weekEnd = weeklyReportService.getCurrentWeekEnd();

      // Verificar se já existe relatório para esta semana
      const hasReport = await weeklyReportService.hasReportForWeek(user.id, weekStart);
      if (hasReport) {
        toast.error('Você já enviou o relatório desta semana');
        return;
      }

      // Verificar se ainda está no prazo
      if (weeklyReportService.isReportDeadlinePassed()) {
        toast.error('O prazo para envio do relatório já passou (domingo meio-dia)');
        return;
      }

      await weeklyReportService.create({
        leader_id: user.id,
        week_start_date: weekStart,
        week_end_date: weekEnd,
        fixed_members_present: data.fixed_members_present,
        guests_present: data.guests_present,
        children_present: data.children_present,
        observations: data.observations || null,
        submitted_at: new Date().toISOString(),
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error(error.message || 'Erro ao enviar relatório');
    } finally {
      setLoading(false);
    }
  };

  const getWeekDateRange = () => {
    const weekStart = weeklyReportService.getCurrentWeekStart();
    const weekEnd = weeklyReportService.getCurrentWeekEnd();
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Enviar Relatório Semanal
              </h3>
              <p className="text-sm text-gray-500">
                Semana: {getWeekDateRange()}
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
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Informações Importantes</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Preencha os dados da reunião da semana</li>
              <li>• Todos os campos numéricos são obrigatórios</li>
              <li>• O campo observações é opcional</li>
              <li>• Prazo: até domingo meio-dia</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Membros Fixos Presentes *
              </label>
              <input
                {...register('fixed_members_present', { 
                  required: 'Campo obrigatório',
                  min: { value: 0, message: 'Valor deve ser maior ou igual a 0' },
                  valueAsNumber: true
                })}
                type="number"
                min="0"
                className="input-primary"
                placeholder="0"
              />
              {errors.fixed_members_present && (
                <p className="mt-1 text-sm text-red-600">{errors.fixed_members_present.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Convidados Presentes *
              </label>
              <input
                {...register('guests_present', { 
                  required: 'Campo obrigatório',
                  min: { value: 0, message: 'Valor deve ser maior ou igual a 0' },
                  valueAsNumber: true
                })}
                type="number"
                min="0"
                className="input-primary"
                placeholder="0"
              />
              {errors.guests_present && (
                <p className="mt-1 text-sm text-red-600">{errors.guests_present.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crianças Presentes (sem lifekids) *
              </label>
              <input
                {...register('children_present', { 
                  required: 'Campo obrigatório',
                  min: { value: 0, message: 'Valor deve ser maior ou igual a 0' },
                  valueAsNumber: true
                })}
                type="number"
                min="0"
                className="input-primary"
                placeholder="0"
              />
              {errors.children_present && (
                <p className="mt-1 text-sm text-red-600">{errors.children_present.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alguma observação?
            </label>
            <textarea
              {...register('observations')}
              rows={4}
              className="input-primary"
              placeholder="Descreva qualquer observação importante sobre a reunião (opcional)"
            />
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
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar Relatório'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};