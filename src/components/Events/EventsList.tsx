import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, Calendar, Clock, Users, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { eventService } from '../../services/eventService';
import { attendanceService } from '../../services/attendanceService';
import { userService } from '../../services/userService';
import { Event, User, ROLE_LABELS, ROLE_HIERARCHY } from '../../types';
import { toast } from 'react-toastify';
import { EventForm } from './EventForm';
import { EventDetails } from './EventDetails';
import { formatDate, formatTime } from '../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

export const EventsList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showMemberCheckinModal, setShowMemberCheckinModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lifeMembers, setLifeMembers] = useState<User[]>([]);

  useEffect(() => {
    fetchEvents();
    if (currentUser?.role === 'lider_life') {
      fetchLifeMembers();
    }
  }, [currentUser]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      if (currentUser) {
        const data = await eventService.getByUserRole(currentUser.role, currentUser.id);
        setEvents(data);
      }
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast.error('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  const fetchLifeMembers = async () => {
    if (!currentUser || currentUser.role !== 'lider_life') return;
    
    try {
      const allUsers = await userService.getAll();
      const members = allUsers.filter(user => 
        user.role === 'membro_life' && 
        user.superior_id === currentUser.id &&
        user.is_active
      );
      setLifeMembers(members);
    } catch (error) {
      console.error('Error fetching life members:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!window.confirm(`Você tem certeza que deseja excluir o evento "${eventTitle}"?`)) return;

    try {
      const success = await eventService.delete(eventId);
      if (success) {
        toast.success('Evento excluído com sucesso!');
        fetchEvents();
      } else {
        throw new Error('Falha ao excluir evento');
      }
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error('Erro ao excluir evento');
    }
  };

  const handleCheckinClick = (event: Event) => {
    setSelectedEvent(event);
    setShowCheckinModal(true);
  };

  const handleOwnCheckin = () => {
    setShowCheckinModal(false);
    handleConfirmPresence();
  };

  const handleMemberCheckin = () => {
    setShowCheckinModal(false);
    setShowMemberCheckinModal(true);
  };

  const handleConfirmPresence = async (memberId?: string) => {
    if (!currentUser || !selectedEvent) return;
    
    const userId = memberId || currentUser.id;
    
    try {
      await attendanceService.checkIn(userId, selectedEvent.id);
      
      if (memberId) {
        const member = lifeMembers.find(m => m.id === memberId);
        toast.success(`Check-in realizado para ${member?.name}!`);
        setShowMemberCheckinModal(false);
      } else {
        toast.success('Check-in realizado com sucesso!');
        // Remove o evento da lista apenas para check-in próprio
        fetchEvents();
      }
      
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Erro ao fazer check-in');
    }
  };

  const handleMarkAbsent = async (justification?: string, memberId?: string) => {
    if (!currentUser || !selectedEvent) return;
    
    const userId = memberId || currentUser.id;
    
    try {
      await attendanceService.markAbsent(userId, selectedEvent.id, justification);
      
      if (memberId) {
        const member = lifeMembers.find(m => m.id === memberId);
        toast.success(justification ? `Ausência justificada registrada para ${member?.name}!` : `Ausência registrada para ${member?.name}!`);
        setShowMemberCheckinModal(false);
      } else {
        toast.success(justification ? 'Ausência justificada registrada!' : 'Ausência registrada!');
      }
      
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error marking absent:', error);
      toast.error('Erro ao registrar ausência');
    }
  };

  const canManageEvent = (event: Event) => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    return event.created_by === currentUser.id;
  };

  const canCreateEvent = () => {
    if (!currentUser) return false;
    return ROLE_HIERARCHY[currentUser.role] <= 4; // Até líder de life
  };

  const getFilteredEvents = () => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      let matchesDate = true;
      const eventDate = new Date(event.event_date);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = eventDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          matchesDate = eventDate >= today && eventDate <= weekFromNow;
          break;
        case 'month':
          const monthFromNow = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
          matchesDate = eventDate >= today && eventDate <= monthFromNow;
          break;
        case 'past':
          matchesDate = eventDate < today;
          break;
        default:
          matchesDate = true;
      }
      
      return matchesSearch && matchesDate;
    });
  };

  const filteredEvents = getFilteredEvents();

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleView = (event: Event) => {
    setSelectedEvent(event);
    setShowDetails(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedEvent(null);
    setIsEditing(false);
    fetchEvents();
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedEvent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
            <p className="text-sm text-gray-500">
              Gerencie os eventos da igreja
            </p>
          </div>
          {canCreateEvent() && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Evento
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-primary pl-10"
              />
            </div>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-primary"
            >
              <option value="all">Todos os períodos</option>
              <option value="today">Hoje</option>
              <option value="week">Próximos 7 dias</option>
              <option value="month">Próximo mês</option>
              <option value="past">Eventos passados</option>
            </select>

            <div className="flex items-center text-sm text-gray-500">
              <Filter className="h-4 w-4 mr-2" />
              {filteredEvents.length} evento(s) encontrado(s)
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col space-y-1">
                    {event.is_recurring && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800">
                        Recorrente
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(event.event_date)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatTime(event.event_time)}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-2" />
                    {event.target_roles.map(role => ROLE_LABELS[role]).join(', ')}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleView(event)}
                      className="text-gray-600 hover:text-gray-900 p-1"
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {canManageEvent(event) && (
                      <>
                        <button
                          onClick={() => handleEdit(event)}
                          className="text-primary-600 hover:text-primary-900 p-1"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteEvent(event.id, event.title)}
                          className="text-error-600 hover:text-error-900 p-1"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Check-in sempre disponível */}
                  <button 
                    onClick={() => handleCheckinClick(event)}
                    className="btn-primary text-xs px-3 py-1"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Check-in
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nenhum evento encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou criar um novo evento</p>
            </div>
          </div>
        )}

        {/* Modals */}
        {showForm && (
          <EventForm
            event={selectedEvent}
            isEditing={isEditing}
            onClose={handleCloseForm}
          />
        )}

        {showDetails && selectedEvent && (
          <EventDetails
            event={selectedEvent}
            onClose={handleCloseDetails}
            onEdit={() => {
              handleCloseDetails();
              handleEdit(selectedEvent);
            }}
          />
        )}
      </div>

      {/* Modal de Escolha de Check-in */}
      {showCheckinModal && selectedEvent && (
        <CheckinChoiceModal
          event={selectedEvent}
          onOwnCheckin={handleOwnCheckin}
          onMemberCheckin={currentUser?.role === 'lider_life' ? handleMemberCheckin : undefined}
          onClose={() => {
            setShowCheckinModal(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {/* Modal de Check-in para Membros */}
      {showMemberCheckinModal && selectedEvent && (
        <MemberCheckinModal
          event={selectedEvent}
          members={lifeMembers}
          onConfirmPresence={handleConfirmPresence}
          onMarkAbsent={handleMarkAbsent}
          onClose={() => {
            setShowMemberCheckinModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </>
  );
};

interface CheckinChoiceModalProps {
  event: Event;
  onOwnCheckin: () => void;
  onMemberCheckin?: () => void;
  onClose: () => void;
}

const CheckinChoiceModal: React.FC<CheckinChoiceModalProps> = ({
  event,
  onOwnCheckin,
  onMemberCheckin,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Tipo de Check-in
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
        </div>

        <div className="space-y-3">
          <button
            onClick={onOwnCheckin}
            className="w-full btn-primary"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Check-in Próprio
          </button>

          {onMemberCheckin && (
            <button
              onClick={onMemberCheckin}
              className="w-full btn-secondary"
            >
              <Users className="h-4 w-4 mr-2" />
              Check-in Membro Life
            </button>
          )}
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

interface MemberCheckinModalProps {
  event: Event;
  members: User[];
  onConfirmPresence: (memberId: string) => void;
  onMarkAbsent: (justification: string | undefined, memberId: string) => void;
  onClose: () => void;
}

const MemberCheckinModal: React.FC<MemberCheckinModalProps> = ({
  event,
  members,
  onConfirmPresence,
  onMarkAbsent,
  onClose
}) => {
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [showJustification, setShowJustification] = useState(false);
  const [justification, setJustification] = useState('');

  const handleConfirmPresence = () => {
    if (selectedMember) {
      onConfirmPresence(selectedMember.id);
      setSelectedMember(null);
    }
  };

  const handleMarkAbsent = () => {
    if (selectedMember) {
      onMarkAbsent(showJustification ? justification.trim() || undefined : undefined, selectedMember.id);
      setSelectedMember(null);
      setJustification('');
      setShowJustification(false);
    }
  };

  if (selectedMember) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Check-in para {selectedMember.name}
            </h3>
            <button
              onClick={() => setSelectedMember(null)}
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
          </div>

          <div className="space-y-4">
            <button
              onClick={handleConfirmPresence}
              className="w-full btn-primary"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Presença
            </button>

            <button
              onClick={handleMarkAbsent}
              className="w-full btn-secondary text-red-600 hover:text-red-800"
            >
              Não Participou
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
                    placeholder="Digite a justificativa (opcional)"
                    rows={3}
                    className="input-primary"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setSelectedMember(null)}
              className="btn-secondary"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Selecionar Membro
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
          <p className="text-sm text-gray-600">
            Selecione o membro para fazer o check-in:
          </p>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {members.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhum membro encontrado no seu lifegroup
            </p>
          ) : (
            members.map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-medium text-sm">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.name} {member.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
              </button>
            ))
          )}
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