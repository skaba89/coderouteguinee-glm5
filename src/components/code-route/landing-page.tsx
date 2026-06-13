'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Car,
  UserPlus,
  CalendarCheck,
  FileCheck,
  Award,
  Users,
  Building2,
  ThumbsUp,
  ChevronRight,
  Shield,
  Clock,
  Smartphone
} from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onRegister: () => void;
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);

  return <span>{count.toLocaleString('fr-FR')}{suffix}</span>;
}

export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const steps = [
    {
      icon: UserPlus,
      title: 'Inscription',
      desc: 'Créez votre compte avec vos informations d\'identité',
      color: '#CE1126'
    },
    {
      icon: CalendarCheck,
      title: 'Réservation',
      desc: 'Choisissez votre centre, date et créneau horaire',
      color: '#FCD116'
    },
    {
      icon: FileCheck,
      title: 'Examen',
      desc: 'Passez votre examen théorique dans un centre agréé',
      color: '#009460'
    },
    {
      icon: Award,
      title: 'Résultat',
      desc: 'Recevez votre résultat immédiatement avec certificat',
      color: '#1A2332'
    }
  ];

  const avantages = [
    {
      icon: Shield,
      title: 'Anti-fraude',
      desc: 'Système biométrique et QR code pour garantir l\'authenticité'
    },
    {
      icon: Clock,
      title: 'Résultats instantanés',
      desc: 'Correction automatique et résultat immédiat après l\'examen'
    },
    {
      icon: Smartphone,
      title: 'Accessibilité',
      desc: 'Plateforme disponible sur tous les appareils, partout en Guinée'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A2332] via-[#0d1a2d] to-[#1A2332]"></div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1.5 flex">
          <div className="flex-1" style={{ backgroundColor: '#CE1126' }}></div>
          <div className="flex-1" style={{ backgroundColor: '#FCD116' }}></div>
          <div className="flex-1" style={{ backgroundColor: '#009460' }}></div>
        </div>
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: '#009460' }}></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: '#FCD116' }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="text-center">
            {/* Republic mention */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm">
              <span className="font-medium">🇬🇳 République de Guinée</span>
              <span className="text-white/40">|</span>
              <span>Ministère des Transports</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              CodeRoute{' '}
              <span style={{ color: '#FCD116' }}>Guinée</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-4">
              Plateforme nationale digitale pour l&apos;examen théorique du permis de conduire
            </p>

            <p className="text-base text-gray-400 max-w-xl mx-auto mb-10">
              Réduisez la fraude, améliorez la traçabilité et modernisez le processus
              de délivrance des permis de conduire en Guinée
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-white font-semibold px-8 py-6 text-lg"
                style={{ backgroundColor: '#009460', hover: { backgroundColor: '#007a4e' } }}
                onClick={onRegister}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                S&apos;inscrire
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="font-semibold px-8 py-6 text-lg border-white/30 text-white hover:bg-white/10"
                onClick={onLogin}
              >
                Se connecter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A2332' }}>
              Comment ça marche
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Un processus simple et sécurisé en 4 étapes
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="relative border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6 text-center">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: step.color }}>
                    {index + 1}
                  </div>
                  <div className="w-14 h-14 rounded-xl mx-auto mt-4 mb-4 flex items-center justify-center" style={{ backgroundColor: `${step.color}15` }}>
                    <step.icon className="w-7 h-7" style={{ color: step.color }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#1A2332' }}>{step.title}</h3>
                  <p className="text-gray-500 text-sm">{step.desc}</p>
                  {index < steps.length - 1 && (
                    <ChevronRight className="hidden lg:block absolute right-[-16px] top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A2332' }}>
              Pourquoi CodeRoute Guinée ?
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Une plateforme moderne au service de la sécurité routière
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {avantages.map((av, index) => (
              <div key={index} className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: '#00946015' }}>
                  <av.icon className="w-8 h-8" style={{ color: '#009460' }} />
                </div>
                <h3 className="font-bold text-xl mb-3" style={{ color: '#1A2332' }}>{av.title}</h3>
                <p className="text-gray-500">{av.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 sm:py-24" style={{ backgroundColor: '#1A2332' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-6 h-6" style={{ color: '#FCD116' }} />
              </div>
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                <AnimatedCounter target={50000} suffix="+" />
              </div>
              <p className="text-gray-400 text-lg">Candidats inscrits</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Building2 className="w-6 h-6" style={{ color: '#FCD116' }} />
              </div>
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                <AnimatedCounter target={15} suffix="+" />
              </div>
              <p className="text-gray-400 text-lg">Centres agréés</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <ThumbsUp className="w-6 h-6" style={{ color: '#FCD116' }} />
              </div>
              <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                <AnimatedCounter target={98} suffix="%" />
              </div>
              <p className="text-gray-400 text-lg">Taux de satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="p-8 sm:p-12 rounded-2xl shadow-xl" style={{ backgroundColor: '#009460' }}>
            <Car className="w-12 h-12 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Prêt à passer votre code ?
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
              Inscrivez-vous maintenant et réservez votre examen dans le centre agréé le plus proche
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="font-semibold px-8 py-6 text-lg"
                style={{ backgroundColor: '#FCD116', color: '#1A2332' }}
                onClick={onRegister}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Créer un compte
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="font-semibold px-8 py-6 text-lg border-white/50 text-white hover:bg-white/10"
                onClick={onLogin}
              >
                J&apos;ai déjà un compte
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10" style={{ backgroundColor: '#1A2332' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#009460' }}>
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">CodeRoute <span style={{ color: '#FCD116' }}>Guinée</span></span>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-gray-400 text-sm">🇬🇳 République de Guinée — Ministère des Transports</p>
              <p className="text-gray-500 text-xs mt-1">© 2026 CodeRoute Guinée. Tous droits réservés.</p>
            </div>
          </div>
          <div className="mt-4 flex gap-1 justify-center">
            <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: '#CE1126' }}></div>
            <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: '#FCD116' }}></div>
            <div className="h-1 flex-1 rounded-full" style={{ backgroundColor: '#009460' }}></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
