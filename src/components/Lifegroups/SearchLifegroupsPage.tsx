import React, { useState, useEffect } from 'react';
import { Search, MapPin, Users, Calendar, Clock, Filter, Map } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { groupService } from '../../services/groupService';
import { userService } from '../../services/userService';
import { Group, User, ROLE_LABELS, DAY_LABELS } from '../../types';

export const SearchLifegroupsPage: React.FC = () => {
  const { user } = useAuth();
  const [lifegroups, setLifegroups] = useState<Group[]>([]);
  const [leaders, setLeaders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [dayFilter, setDayFilter] = useState<number | ''>('');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLifegroups();
    }
  }, [user]);

  const fetchLifegroups = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Buscar todos os grupos
      const allGroups = await groupService.getAll();
      const allUsers = await userService.getAll();
      
      // Filtrar apenas lifegroups
      const lifegroupsOnly = allGroups.filter(group => group.type === 'lifegroup');
      
      // Filtrar baseado na hierarquia
      let filteredLifegroups = lifegroupsOnly;
      
      if (user.role !== 'superadmin') {
        // Buscar subordinados baseado na hierarquia
        const subordinates = getSubordinateUsers(user.id, user.role, allUsers);
        const subordinateIds = subordinates.map(s => s.id);
        
        filteredLifegroups = lifegroupsOnly.filter(group => 
          subordinateIds.includes(group.leader_id)
        );
      }
      
      setLifegroups(filteredLifegroups);
      
      // Buscar líderes dos lifegroups
      const lifeLeaders = allUsers.filter(u => 
        filteredLifegroups.some(group => group.leader_id === u.id)
      );
      setLeaders(lifeLeaders);
      
    } catch (error) {
      console.error('Error fetching lifegroups:', error);
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
          addSubordinates(sub.id, ['lider_setor', 'lider_life']);
        } else if (sub.role === 'lider_setor') {
          addSubordinates(sub.id, ['lider_life']);
        }
      });
    };
    
    switch (userRole) {
      case 'pastor_rede':
        addSubordinates(userId, ['lider_area', 'lider_setor', 'lider_life']);
        break;
      case 'lider_area':
        addSubordinates(userId, ['lider_setor', 'lider_life']);
        break;
      case 'lider_setor':
        addSubordinates(userId, ['lider_life']);
        break;
    }
    
    return subordinates;
  };

  const getFilteredLifegroups = () => {
    return lifegroups.filter(group => {
      const leader = leaders.find(l => l.id === group.leader_id);
      
      const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (leader && `${leader.name} ${leader.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (group.address && group.address.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRegion = !regionFilter || 
                           (group.address && group.address.toLowerCase().includes(regionFilter.toLowerCase()));
      
      const matchesDay = dayFilter === '' || group.meeting_day === dayFilter;
      
      return matchesSearch && matchesRegion && matchesDay;
    });
  };

  const getUniqueRegions = () => {
    const regions = new Set<string>();
    lifegroups.forEach(group => {
      if (group.address) {
        // Extrair bairro/região do endereço (simplificado)
        const parts = group.address.split(',');
        if (parts.length >= 2) {
          const region = parts[1].trim();
          regions.add(region);
        }
      }
    });
    return Array.from(regions).sort();
  };

  const filteredLifegroups = getFilteredLifegroups();
  const regions = getUniqueRegions();

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
            <Search className="h-8 w-8 text-primary-600 mr-3" />
            Buscar Lifegroups
          </h1>
          <p className="text-sm text-gray-500">
            Encontre e visualize lifegroups por região, líder ou dia da semana
          </p>
        </div>
        
        <button
          onClick={() => setShowMap(!showMap)}
          className={`btn-secondary ${showMap ? 'bg-primary-100 text-primary-700' : ''}`}
        >
          <Map className="h-5 w-5 mr-2" />
          {showMap ? 'Lista' : 'Mapa'}
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, líder ou endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-primary pl-10"
            />
          </div>
          
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="input-primary"
          >
            <option value="">Todas as regiões</option>
            {regions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <select
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value === '' ? '' : Number(e.target.value))}
            className="input-primary"
          >
            <option value="">Todos os dias</option>
            {Object.entries(DAY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <div className="flex items-center text-sm text-gray-500">
            <Filter className="h-4 w-4 mr-2" />
            {filteredLifegroups.length} lifegroup(s) encontrado(s)
          </div>
        </div>
      </div>

      {showMap ? (
        /* Visualização do Mapa */
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Mapa dos Lifegroups</h2>
          </div>
          <div className="p-6">
            <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Map className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Mapa dos Lifegroups</p>
                <p className="text-sm">Integração com Google Maps em desenvolvimento</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {filteredLifegroups.slice(0, 4).map((group) => {
                    const leader = leaders.find(l => l.id === group.leader_id);
                    return (
                      <div key={group.id} className="bg-white p-3 rounded-lg shadow text-left">
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <p className="text-sm text-gray-600">
                          Líder: {leader ? `${leader.name} ${leader.last_name}` : 'N/A'}
                        </p>
                        {group.address && (
                          <p className="text-xs text-gray-500 mt-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {group.address}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Lista de Lifegroups */
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Lista de Lifegroups</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredLifegroups.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nenhum lifegroup encontrado</p>
                <p className="text-sm">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              filteredLifegroups.map((group) => {
                const leader = leaders.find(l => l.id === group.leader_id);
                return (
                  <div key={group.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      {group.image_url ? (
                        <img
                          src={group.image_url}
                          alt={group.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Users className="h-8 w-8 text-primary-600" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                            {leader && (
                              <p className="text-sm text-gray-600">
                                Líder: {leader.name} {leader.last_name} - {ROLE_LABELS[leader.role]}
                              </p>
                            )}
                            {group.description && (
                              <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          {group.meeting_day !== null && group.meeting_time && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{DAY_LABELS[group.meeting_day]} às {group.meeting_time}</span>
                            </div>
                          )}
                          
                          {group.address && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="truncate">{group.address}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Criado em {new Date(group.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-primary-600">{lifegroups.length}</div>
          <div className="text-sm text-gray-500">Total de Lifegroups</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-green-600">{regions.length}</div>
          <div className="text-sm text-gray-500">Regiões Atendidas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-blue-600">
            {lifegroups.filter(g => g.meeting_day !== null).length}
          </div>
          <div className="text-sm text-gray-500">Com Reuniões Definidas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <div className="text-2xl font-bold text-purple-600">
            {lifegroups.filter(g => g.address).length}
          </div>
          <div className="text-sm text-gray-500">Com Endereço Cadastrado</div>
        </div>
      </div>
    </div>
  );
};