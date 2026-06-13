'use client';

import React from 'react';
import { ViewType, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  Car,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Shield,
  BookOpen
} from 'lucide-react';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { user, logout, isLoggedIn } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isAdmin = user?.role === 'administration';
  const showNav = isLoggedIn;

  const navItems = isAdmin
    ? [
        { view: 'admin-dashboard' as ViewType, label: 'Tableau de bord', icon: LayoutDashboard },
        { view: 'landing' as ViewType, label: 'Accueil', icon: Car },
      ]
    : [
        { view: 'candidate-dashboard' as ViewType, label: 'Tableau de bord', icon: LayoutDashboard },
        { view: 'exam-booking' as ViewType, label: 'Réserver', icon: BookOpen },
        { view: 'practice-test' as ViewType, label: 'Entraînement', icon: BookOpen },
        { view: 'results' as ViewType, label: 'Résultats', icon: Shield },
      ];

  if (!showNav && currentView === 'landing') {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm" style={{ borderColor: '#e5e7eb' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange(isAdmin ? 'admin-dashboard' : 'candidate-dashboard')}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#009460' }}>
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg" style={{ color: '#1A2332' }}>CodeRoute <span style={{ color: '#009460' }}>Guinée</span></span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Button
                key={item.view}
                variant={currentView === item.view ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewChange(item.view)}
                className={currentView === item.view ? 'text-white' : ''}
                style={currentView === item.view ? { backgroundColor: '#009460' } : {}}
              >
                <item.icon className="w-4 h-4 mr-1" />
                {item.label}
              </Button>
            ))}
            {user && (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l">
                <div className="text-sm">
                  <span className="font-medium" style={{ color: '#1A2332' }}>{user.prenom} {user.nom}</span>
                  <span className="block text-xs text-gray-500">{user.numeroUnique}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <LogOut className="w-4 h-4 mr-1" />
                  Déconnexion
                </Button>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="sm" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-2">
            {user && (
              <div className="pb-3 mb-3 border-b">
                <span className="font-medium" style={{ color: '#1A2332' }}>{user.prenom} {user.nom}</span>
                <span className="block text-xs text-gray-500">{user.numeroUnique}</span>
              </div>
            )}
            {navItems.map(item => (
              <Button
                key={item.view}
                variant={currentView === item.view ? 'default' : 'ghost'}
                size="sm"
                className={`w-full justify-start ${currentView === item.view ? 'text-white' : ''}`}
                onClick={() => { onViewChange(item.view); setMobileOpen(false); }}
                style={currentView === item.view ? { backgroundColor: '#009460' } : {}}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" className="w-full justify-start text-red-600" onClick={() => { logout(); setMobileOpen(false); }}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
