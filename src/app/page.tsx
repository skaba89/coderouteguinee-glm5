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
import LanguageSelection from '@/components/code-route/language-selection';
import CoursesPage from '@/components/code-route/courses-page';

type LanguageSelectContext = 'exam' | 'practice' | 'course' | 'registration';

function AppContent() {
  const { user, isLoggedIn } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [latestResult, setLatestResult] = useState<ExamResult | null>(null);
  const [examLanguage, setExamLanguage] = useState<NationalLanguage>('fr');
  const [languageSelectContext, setLanguageSelectContext] = useState<LanguageSelectContext>('exam');

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

  // Trigger language selection for different contexts
  const handleStartExam = useCallback(() => {
    setLanguageSelectContext('exam');
    setCurrentView('language-select');
  }, []);

  const handleStartPractice = useCallback(() => {
    setLanguageSelectContext('practice');
    setCurrentView('language-select');
  }, []);

  const handleStartCourse = useCallback(() => {
    setLanguageSelectContext('course');
    setCurrentView('language-select');
  }, []);

  const handleLanguageSelect = useCallback((lang: NationalLanguage) => {
    setExamLanguage(lang);
    // Route based on context
    switch (languageSelectContext) {
      case 'exam':
        setCurrentView('exam-taking');
        break;
      case 'practice':
        setCurrentView('practice-test');
        break;
      case 'course':
        setCurrentView('courses');
        break;
      case 'registration':
        setCurrentView('candidate-dashboard');
        break;
      default:
        setCurrentView('exam-taking');
    }
  }, [languageSelectContext]);

  const isExamTaking = currentView === 'exam-taking' || currentView === 'practice-test';

  return (
    <div className="min-h-screen flex flex-col">
      {!isExamTaking && currentView !== 'language-select' && (
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
        {currentView === 'admin-dashboard' && (
          <AdminDashboard />
        )}
        {currentView === 'analytics' && (
          <AdminDashboard />
        )}
        {currentView === 'fraud-monitoring' && (
          <AdminDashboard />
        )}
        {currentView === 'center-management' && (
          <AdminDashboard />
        )}
        {currentView === 'settings' && (
          <AdminDashboard />
        )}
        {currentView === 'language-select' && (
          <LanguageSelection
            onViewChange={handleViewChange}
            onSelect={handleLanguageSelect}
            context={languageSelectContext === 'course' ? 'course' : languageSelectContext === 'registration' ? 'registration' : 'exam'}
          />
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
