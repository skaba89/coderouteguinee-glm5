'use client';

import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { LanguageProvider } from '@/lib/language-context';
import { ViewType, ExamResult, NationalLanguage } from '@/lib/types';
import Navigation from '@/components/code-route/navigation';
import LandingPage from '@/components/code-route/landing-page';
import AuthModals from '@/components/code-route/auth-modals';
import CandidateDashboard from '@/components/code-route/candidate-dashboard';
import ExamBooking from '@/components/code-route/exam-booking';
import ExamTaking from '@/components/code-route/exam-taking';
import Results from '@/components/code-route/results';
import AdminDashboard from '@/components/code-route/admin-dashboard';
import CoursesPage from '@/components/code-route/courses-page';

function AppContent() {
  const { user, isLoggedIn } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [latestResult, setLatestResult] = useState<ExamResult | null>(null);
  // Language always French for now -- local language selection disabled
  const examLanguage: NationalLanguage = 'fr';

  const handleViewChange = useCallback((view: ViewType) => {
    setCurrentView(view);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    // Route based on user role
    if (user?.role === 'administration' || user?.role === 'super-admin' || user?.role === 'centre-agree') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('candidate-dashboard');
    }
  }, [user?.role]);

  const handleExamComplete = useCallback((result: ExamResult) => {
    setLatestResult(result);
  }, []);

  const isExamTaking = currentView === 'exam-taking' || currentView === 'practice-test';

  // Determine if current user should see admin views
  const isAdminRole = user?.role === 'administration' || user?.role === 'super-admin' || user?.role === 'centre-agree';

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
        {currentView === 'courses' && (
          <CoursesPage onViewChange={handleViewChange} />
        )}
        {currentView === 'exam-booking' && (
          <ExamBooking onViewChange={handleViewChange} />
        )}
        {currentView === 'exam-taking' && (
          <ExamTaking
            isPractice={false}
            onViewChange={handleViewChange}
            onExamComplete={handleExamComplete}
            preselectedLanguage={examLanguage}
          />
        )}
        {currentView === 'practice-test' && (
          <ExamTaking
            isPractice={true}
            onViewChange={handleViewChange}
            onExamComplete={handleExamComplete}
            preselectedLanguage={examLanguage}
          />
        )}
        {currentView === 'results' && (
          <Results latestResult={latestResult} onViewChange={handleViewChange} />
        )}
        {/* All admin sub-views render the same AdminDashboard component, which manages its own tabs */}
        {(currentView === 'admin-dashboard' || currentView === 'analytics' || currentView === 'fraud-monitoring' || currentView === 'center-management' || currentView === 'settings') && (
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
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
