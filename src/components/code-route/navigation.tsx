'use client';

import React, { useState, useEffect } from 'react';
import { ViewType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useAuth } from '@/lib/auth-context';
import { NotificationsBell } from './notifications-bell';
import {
  Car,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Shield,
  BookOpen,
  Globe,
  GraduationCap,
  BarChart3,
  AlertTriangle,
  Search,
  Settings,
  User,
  ChevronDown,
  FileCheck,
  Building2,
  Keyboard,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { user, logout, isLoggedIn } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isAdmin = user?.role === 'administration' || user?.role === 'super-admin';
  const isAutoEcole = user?.role === 'auto-ecole';
  const isCentre = user?.role === 'centre-agree';
  const showNav = isLoggedIn;

  const adminNavItems = [
    { view: 'admin-dashboard' as ViewType, label: 'Vue d\'ensemble', icon: LayoutDashboard, section: 'principal' },
    { view: 'analytics' as ViewType, label: 'Analyses', icon: BarChart3, section: 'principal' },
    { view: 'fraud-monitoring' as ViewType, label: 'Anti-fraude', icon: AlertTriangle, section: 'principal' },
    { view: 'center-management' as ViewType, label: 'Centres', icon: Building2, section: 'principal' },
  ];

  const autoEcoleNavItems = [
    { view: 'auto-ecole-dashboard' as ViewType, label: 'Vue d\'ensemble', icon: LayoutDashboard, section: 'principal' },
  ];

  const centreNavItems = [
    { view: 'centre-dashboard' as ViewType, label: 'Vue d\'ensemble', icon: LayoutDashboard, section: 'principal' },
  ];

  const candidateNavItems = [
    { view: 'candidate-dashboard' as ViewType, label: 'Tableau de bord', icon: LayoutDashboard },
    { view: 'courses' as ViewType, label: 'Cours', icon: GraduationCap },
    { view: 'exam-booking' as ViewType, label: 'Réserver', icon: BookOpen },
    { view: 'practice-test' as ViewType, label: 'Entraînement', icon: FileCheck },
    { view: 'results' as ViewType, label: 'Résultats', icon: Shield },
  ];

  const navItems = isAdmin
    ? adminNavItems
    : isAutoEcole
      ? autoEcoleNavItems
      : isCentre
        ? centreNavItems
        : candidateNavItems;

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!showNav && currentView === 'landing') {
    return null;
  }

  if (!showNav) return null;

  const userInitials = user
    ? `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase()
    : 'U';

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200/80">
        {/* Guinea tricolor stripe */}
        <div className="h-0.5 flex">
          <div className="flex-1" style={{ backgroundColor: '#CE1126' }}></div>
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }}></div>
          <div className="flex-1" style={{ backgroundColor: '#009460' }}></div>
        </div>

        {/* Main bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => onViewChange(
                  isAdmin ? 'admin-dashboard' :
                  isAutoEcole ? 'auto-ecole-dashboard' :
                  isCentre ? 'centre-dashboard' :
                  'candidate-dashboard'
                )}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#009460' }}>
                  <Car className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg hidden sm:inline" style={{ color: '#1A2332' }}>
                  CodeRoute <span style={{ color: '#009460' }}>Guinée</span>
                </span>
                <span className="font-bold sm:hidden" style={{ color: '#1A2332' }}>
                  CR<span style={{ color: '#009460' }}>G</span>
                </span>
              </div>

              {/* Desktop nav items */}
              <div className="hidden lg:flex items-center gap-0.5">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.view;
                  return (
                    <Button
                      key={item.view}
                      variant="ghost"
                      size="sm"
                      className={`text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-white hover:text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      style={isActive ? { backgroundColor: '#009460' } : {}}
                      onClick={() => onViewChange(item.view)}
                    >
                      <Icon className="w-4 h-4 mr-1.5" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Right: Search, Notif, User */}
            <div className="flex items-center gap-2">
              {/* Search button */}
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-2 text-gray-500 bg-gray-50 border-gray-200 hover:bg-gray-100 h-8 px-3"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-3.5 h-3.5" />
                <span className="text-xs">Rechercher</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-gray-400">
                  <Keyboard className="w-2.5 h-2.5" />K
                </kbd>
              </Button>

              {/* Mobile search */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-gray-500"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>

              {/* Notifications bell (admin/super-admin only) */}
              {user && (user.role === 'administration' || user.role === 'super-admin') && (
                <NotificationsBell />
              )}

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1 h-9 hover:bg-gray-100">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback
                        className="text-xs font-bold text-white"
                        style={{ backgroundColor: '#1A2332' }}
                      >
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden xl:inline" style={{ color: '#1A2332' }}>
                      {user?.prenom}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium" style={{ color: '#1A2332' }}>{user?.prenom} {user?.nom}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5" style={{ borderColor: '#009460', color: '#009460' }}>
                          {user?.role === 'administration' ? 'Admin' : 'Candidat'}
                        </Badge>
                        <span className="text-[10px] text-gray-400">{user?.numeroUnique}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onViewChange(isAdmin ? 'admin-dashboard' : 'candidate-dashboard')}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Tableau de bord
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => onViewChange('settings')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Paramètres
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Aide et support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-gray-500"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Admin secondary nav (breadcrumb-like) */}
        {isAdmin && (
          <div className="border-t border-gray-100 bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 h-9 text-xs overflow-x-auto">
                <span className="text-gray-400 flex-shrink-0">Administration</span>
                <span className="text-gray-300">/</span>
                <span className="font-medium text-gray-700 flex-shrink-0">
                  {adminNavItems.find(i => i.view === currentView)?.label || 'Vue d\'ensemble'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t bg-white">
            <div className="px-4 py-3 space-y-2">
              {user && (
                <div className="pb-3 mb-3 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs font-bold text-white" style={{ backgroundColor: '#1A2332' }}>
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium text-sm" style={{ color: '#1A2332' }}>{user.prenom} {user.nom}</span>
                      <span className="block text-xs text-gray-500">{user.numeroUnique}</span>
                    </div>
                  </div>
                </div>
              )}
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.view;
                return (
                  <Button
                    key={item.view}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-start ${isActive ? 'text-white' : ''}`}
                    onClick={() => { onViewChange(item.view); setMobileOpen(false); }}
                    style={isActive ? { backgroundColor: '#009460' } : {}}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
              <div className="pt-2 border-t">
                <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { logout(); setMobileOpen(false); }}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Command Palette (Ctrl+K) */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Rechercher une page, une fonctionnalité..." />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {isAdmin ? (
              adminNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.view}
                    onSelect={() => { onViewChange(item.view); setSearchOpen(false); }}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </CommandItem>
                );
              })
            ) : (
              candidateNavItems.map(item => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.view}
                    onSelect={() => { onViewChange(item.view); setSearchOpen(false); }}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </CommandItem>
                );
              })
            )}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => { setSearchOpen(false); }}>
              <Globe className="w-4 h-4 mr-2" />
              Paramètres de langue (bientôt disponible)
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); }}>
              <HelpCircle className="w-4 h-4 mr-2" />
              Aide et support
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
