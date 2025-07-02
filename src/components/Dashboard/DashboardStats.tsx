import React, { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { eventService } from '../../services/eventService';
import { attendanceService } from '../../services/attendanceService';

export const DashboardStats: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeMembers: 0,
    eventsThisMonth: 0,
    attendanceRate: 0,
    todayCheckIns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários ativos
      const users = await userService.getAll();
      const activeMembers = users.filter(u => u.is_active).length;

      // Buscar eventos deste mês
      const events = await eventService.getAll();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const eventsThisMonth = events.filter(event => {
        const eventDate = new Date(event.event_date);
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
      }).length;

      // Buscar estatísticas de presença
      const attendanceStats = await attendanceService.getStats();

      setStats({
        activeMembers,
        eventsThisMonth,
        attendanceRate: attendanceStats.attendanceRate,
        todayCheckIns: attendanceStats.todayCheckIns,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      name: 'Membros Ativos',
      value: loading ? '...' : stats.activeMembers.toString(),
      change: '+4.5%',
      icon: Users,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      name: 'Eventos este Mês',
      value: loading ? '...' : stats.eventsThisMonth.toString(),
      change: '+2.1%',
      icon: Calendar,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
    },
    {
      name: 'Taxa de Presença',
      value: loading ? '...' : `${stats.attendanceRate}%`,
      change: '+5.2%',
      icon: TrendingUp,
      color: 'text-accent-600',
      bgColor: 'bg-accent-100',
    },
    {
      name: 'Check-ins Hoje',
      value: loading ? '...' : stats.todayCheckIns.toString(),
      change: '+12.3%',
      icon: CheckCircle,
      color: 'text-success-600',
      bgColor: 'bg-success-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat) => (
        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};