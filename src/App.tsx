import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Login/LoginForm';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { UsersList } from './components/Users/UsersList';
import { EventsList } from './components/Events/EventsList';
import { MessagesPage } from './components/Messages/MessagesPage';
import { MyGroupPage } from './components/Groups/MyGroupPage';
import { AdminPage } from './components/Admin/AdminPage';
import { AllGroupsPage } from './components/Admin/AllGroupsPage';
import { TracksPage } from './components/Admin/TracksPage';
import { ReportsPage } from './components/Reports/ReportsPage';
import { SearchLifegroupsPage } from './components/Lifegroups/SearchLifegroupsPage';
import { MyCheckinsPage } from './components/Checkins/MyCheckinsPage';
import { SettingsPage } from './components/Settings/SettingsPage';
import { Loading } from './components/common/Loading';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente para rotas que requerem função de líder
const LeaderRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Superadmin tem acesso a tudo
  if (user.role === 'superadmin') {
    return <>{children}</>;
  }

  // Apenas líderes (não membros) podem acessar
  if (user.role === 'membro_life') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Componente para rotas de líderes superiores (não líderes de life e não membros)
const UpperLeaderRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Superadmin tem acesso a tudo
  if (user.role === 'superadmin') {
    return <>{children}</>;
  }

  // Apenas líderes superiores (não líderes de life e não membros)
  if (user.role === 'membro_life' || user.role === 'lider_life') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Componente para rotas exclusivas do superadmin
const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Apenas superadmin pode acessar
  if (user.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Líderes/Membros - Para líderes superiores (não membros e não líderes de life) */}
        <Route path="users" element={
          <UpperLeaderRoute>
            <UsersList />
          </UpperLeaderRoute>
        } />
        
        {/* Rotas para líderes e superadmin */}
        <Route path="my-group" element={
          <LeaderRoute>
            <MyGroupPage />
          </LeaderRoute>
        } />
        
        {/* Buscar Lifegroups - Para todos os líderes (incluindo líderes de life) */}
        <Route path="search-lifegroups" element={
          <LeaderRoute>
            <SearchLifegroupsPage />
          </LeaderRoute>
        } />
        
        {/* Trilhos - Para todos os usuários (hierárquico) */}
        <Route path="tracks" element={<TracksPage />} />
        
        {/* Rotas exclusivas do superadmin */}
        <Route path="admin" element={
          <SuperAdminRoute>
            <AdminPage />
          </SuperAdminRoute>
        } />
        <Route path="all-groups" element={
          <SuperAdminRoute>
            <AllGroupsPage />
          </SuperAdminRoute>
        } />
        
        {/* Rotas para todos */}
        <Route path="events" element={<EventsList />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="my-checkins" element={<MyCheckinsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App font-inter">
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;