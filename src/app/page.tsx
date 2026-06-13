'use client';

import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ViewType, ExamResult } from '@/lib/types';
import Navigation from '@/components/code-route/navigation';
import LandingPage from '@/components/code-route/landing-page';
import AuthModals from '@/components/code-route/auth-modals';
import CandidateDashboard from '@/components/code-route/candidate-dashboard';
import ExamBooking from '@/components/code-route/exam-booking';
import ExamTaking from '@/components/code-route/exam-taking';
import Results from '@/components/code-route/results';
import AdminDashboard from '@/components/code-route/admin-dashboard';

function AppContent() {
  const { user, isLoggedIn } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [latestResult, setLatestResult] = useState<ExamResult | null>(null);

  const handleViewChange = useCallback((view: ViewType) => {
    setCurrentView(view);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    if (user?.role === 'administration') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('candidate-dashboard');
    }
  }, [user?.role]);

  const handleExamComplete = useCallback((result: ExamResult) => {
    setLatestResult(result);
  }, []);

  const isExamTaking = currentView === 'exam-taking' || currentView === 'practice-test';

  return (
    <div className="min-h-screen flex flex-col">
      {!isExamTaking && (
        <Navigation currentView={currentView} onViewChange={handleViewChange} />
      )}

      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onLogin={() => setLoginOpen(true)}
            onRegister={() => setRegisterOpen(true)}
          />
        )}
        {currentView === 'candidate-dashboard' && (
          <CandidateDashboard onViewChange={handleViewChange} />
        )}
        {currentView === 'exam-booking' && (
          <ExamBooking onViewChange={handleViewChange} />
        )}
        {currentView === 'exam-taking' && (
          <ExamTaking
            isPractice={false}
            onViewChange={handleViewChange}
            onExamComplete={handleExamComplete}
          />
        )}
        {currentView === 'practice-test' && (
          <ExamTaking
            isPractice={true}
            onViewChange={handleViewChange}
            onExamComplete={handleExamComplete}
          />
        )}
        {currentView === 'results' && (
          <Results latestResult={latestResult} onViewChange={handleViewChange} />
        )}
        {currentView === 'admin-dashboard' && (
          <AdminDashboard />
        )}
      </main>

      <AuthModals
        loginOpen={loginOpen}
        registerOpen={registerOpen}
        onCloseLogin={() => setLoginOpen(false)}
        onCloseRegister={() => setRegisterOpen(false)}
        onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }}
        onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
