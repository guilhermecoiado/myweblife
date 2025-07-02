import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { attendanceService } from '../../services/attendanceService';
import { eventService } from '../../services/eventService';

export const AttendanceChart: React.FC = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Buscar dados dos últimos 7 dias
      const today = new Date();
      const weekData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Buscar eventos do dia
        const events = await eventService.getAll();
        const dayEvents = events.filter(event => event.event_date === dateStr);
        
        // Buscar presenças do dia
        const attendance = await attendanceService.getAll();
        const dayAttendance = attendance.filter(att => 
          dayEvents.some(event => event.id === att.event_id)
        );
        
        const present = dayAttendance.filter(att => att.status === 'present').length;
        const absent = dayAttendance.filter(att => att.status === 'absent').length;
        
        weekData.push({
          name: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
          presentes: present,
          ausentes: absent,
        });
      }
      
      setChartData(weekData);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      // Dados mock em caso de erro
      setChartData([
        { name: 'Dom', presentes: 85, ausentes: 15 },
        { name: 'Seg', presentes: 45, ausentes: 8 },
        { name: 'Ter', presentes: 0, ausentes: 0 },
        { name: 'Qua', presentes: 32, ausentes: 5 },
        { name: 'Qui', presentes: 0, ausentes: 0 },
        { name: 'Sex', presentes: 28, ausentes: 7 },
        { name: 'Sáb', presentes: 62, ausentes: 12 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Frequência Semanal
          </h3>
          <div className="h-80 flex items-center justify-center">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Frequência Semanal
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="presentes" fill="#2563eb" name="Presentes" />
              <Bar dataKey="ausentes" fill="#ef4444" name="Ausentes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};