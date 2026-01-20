import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SignalementProvider } from './context/SignalementContext';

// Components
import Header from './components/layout/Header';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignalementsManager from './pages/manager/SignalementsManager';
import UsersManager from './pages/manager/UsersManager';

import './App.css';

// Route protégée pour les managers
const ManagerRoute = ({ children }) => {
  const { user, isManager, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-page">Chargement...</div>;
  }
  
  if (!user || !isManager()) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            {/* Page d'accueil - accessible à tous */}
            <Route path="/" element={<HomePage />} />
            
            {/* Page de connexion */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Pages Manager - protégées */}
            <Route 
              path="/manager/signalements" 
              element={
                <ManagerRoute>
                  <SignalementsManager />
                </ManagerRoute>
              } 
            />
            <Route 
              path="/manager/users" 
              element={
                <ManagerRoute>
                  <UsersManager />
                </ManagerRoute>
              } 
            />
            
            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <SignalementProvider>
        <AppContent />
      </SignalementProvider>
    </AuthProvider>
  );
}

export default App;