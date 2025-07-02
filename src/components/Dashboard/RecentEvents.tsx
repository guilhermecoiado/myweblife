import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { eventService } from '../../services/eventService';
import { attendanceService } from '../../services/attendanceService';
import { Event } from '../../types';
import { toast } from 'react-toastify';
import { formatDate, formatTime, formatDateTime, isToday } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { EventDetails } from '../Events/EventDetails';

export const RecentEvents: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchUpcomingEvents();
  }, [user]);

  const fetchUpcomingEvents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const allEvents = await eventService.getByUserRole(user.role, user.id);
      
      // Filtrar eventos futuros ou de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const upcomingEvents = allEvents.filter(event => {
        const eventDate = new Date(event.event_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      }).slice(0, 3); // Mostrar apenas os próximos 3 eventos
      
      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckinClick = (event: Event) => {
    setSelectedEvent(event);
    setShowCheckinModal(true);
  };

  const handleDetailsClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleConfirmPresence = async () => {
    if (!user || !selectedEvent) return;
    
    try {
      await attendanceService.checkIn(user.id, selectedEvent.id);
      toast.success('Check-in realizado com sucesso!');
      setShowCheckinModal(false);
      setSelectedEvent(null);
      
      // Navegar para a página de checkins
      navigate('/my-checkins');
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Erro ao fazer check-in');
    }
  };

  const handleMarkAbsent = async (justification?: string) => {
    if (!user || !selectedEvent) return;
    
    try {
      await attendanceService.markAbsent(user.id, selectedEvent.id, justification);
      
      toast.success(justification ? 'Ausência justificada registrada!' : 'Ausência registrada!');
      setShowCheckinModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error marking absent:', error);
      toast.error('Erro ao registrar ausência');
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Próximos Eventos
          </h3>
          <div className="flex items-center justify-center h-32">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Próximos Eventos
          </h3>
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Nenhum evento próximo</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isToday(event.event_date) 
                      ? 'border-primary-200 bg-primary-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {event.title}
                        </h4>
                        {isToday(event.event_date) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            Hoje
                          </span>
                        )}
                        {event.is_recurring && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                            Recorrente
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(event.event_date)}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(event.event_time)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button 
                      onClick={() => handleCheckinClick(event)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Check-in
                    </button>
                    <button 
                      onClick={() => handleDetailsClick(event)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Check-in */}
      {showCheckinModal && selectedEvent && (
        <CheckinModal
          event={selectedEvent}
          onConfirmPresence={handleConfirmPresence}
          onMarkAbsent={handleMarkAbsent}
          onClose={() => {
            setShowCheckinModal(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {/* Modal de Detalhes do Evento */}
      {showEventDetails && selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => {
            setShowEventDetails(false);
            setSelectedEvent(null);
          }}
          onEdit={() => {
            // Fechar modal e navegar para eventos
            setShowEventDetails(false);
            setSelectedEvent(null);
            navigate('/events');
          }}
        />
      )}
    </>
  );
};

interface CheckinModalProps {
  event: Event;
  onConfirmPresence: () => void;
  onMarkAbsent: (justification?: string) => void;
  onClose: () => void;
}

const CheckinModal: React.FC<CheckinModalProps> = ({
  event,
  onConfirmPresence,
  onMarkAbsent,
  onClose
}) => {
  const [showJustification, setShowJustification] = useState(false);
  const [justification, setJustification] = useState('');

  const handleAbsentClick = () => {
    if (showJustification) {
      onMarkAbsent(justification.trim() || undefined);
    } else {
      onMarkAbsent();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Check-in do Evento
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-2">
            {event.title}
          </h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {formatDate(event.event_date)}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              {formatTime(event.event_time)}
            </div>
          </div>
          {event.description && (
            <p className="text-sm text-gray-600 mt-2">{event.description}</p>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={onConfirmPresence}
            className="w-full btn-primary"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirmar Presença
          </button>

          <button
            onClick={handleAbsentClick}
            className="w-full btn-secondary text-red-600 hover:text-red-800"
          >
            Não Participei
          </button>

          <div className="border-t pt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showJustification}
                onChange={(e) => setShowJustification(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Deseja justificar a ausência? (opcional)
              </span>
            </label>

            {showJustification && (
              <div className="mt-3">
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Digite sua justificativa (opcional)"
                  rows={3}
                  className="input-primary"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};