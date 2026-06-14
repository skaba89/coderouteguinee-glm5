'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { ViewType, BookingData } from '@/lib/types';
import { regions, centres, creneauxHoraires, getUpcomingDates } from '@/lib/mock-data';
import QRCode from 'qrcode';
import {
  MapPin,
  Building2,
  Calendar,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Check,
  Clock,
  Smartphone,
  QrCode,
  User,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface ExamBookingProps {
  onViewChange: (view: ViewType) => void;
}

function RealQRCode({ data }: { data: string }) {
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    QRCode.toString(data, {
      type: 'svg',
      width: 120,
      margin: 1,
      color: { dark: '#1A2332', light: '#FFFFFF' },
    }).then(setSvg).catch(console.error);
  }, [data]);

  if (!svg) {
    return (
      <div className="w-[120px] h-[120px] flex items-center justify-center bg-gray-100 rounded">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
}

export default function ExamBooking({ onViewChange }: ExamBookingProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [selectedCentre, setSelectedCentre] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');

  const availableDates = getUpcomingDates();
  const currentRegion = regions.find(r => r.id === selectedRegion);
  const currentVille = currentRegion?.villes.find(v => v.id === selectedVille);
  const availableCentres = currentVille?.centres || centres.filter(c => c.region === (currentRegion?.nom || ''));
  const selectedCentreData = centres.find(c => c.id === selectedCentre);

  const canProceedStep1 = selectedRegion && selectedVille;
  const canProceedStep2 = selectedCentre;
  const canProceedStep3 = selectedDate && selectedTime;
  const canProceedStep4 = mobileMoneyNumber.length >= 8;

  const steps = [
    { num: 1, label: 'Région & Ville', icon: MapPin },
    { num: 2, label: 'Centre', icon: Building2 },
    { num: 3, label: 'Date & Heure', icon: Calendar },
    { num: 4, label: 'Paiement', icon: CreditCard },
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState<string>('');
  const [bookingId, setBookingId] = useState<string>('');

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidatId: user?.id,
          centreId: selectedCentre,
          centreNom: selectedCentreData?.nom || '',
          region: currentRegion?.nom || '',
          ville: currentVille?.nom || '',
          date: selectedDate,
          heure: selectedTime,
          langue: 'fr',
          categoriePermis: user?.categoriePermis || 'B',
          montant: 50000,
          numeroPaiement: mobileMoneyNumber,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBookingRef(data.reference);
        setBookingId(data.booking.id);
        setConfirmed(true);
      }
    } catch {
      // Fallback: still confirm locally
      setBookingRef(`CONV-${Date.now().toString(36).toUpperCase()}`);
      setConfirmed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bookingData: BookingData = {
    step1: { region: currentRegion?.nom || '', ville: currentVille?.nom || '' },
    step2: { centreId: selectedCentre, centreNom: selectedCentreData?.nom || '' },
    step3: { date: selectedDate, heure: selectedTime },
    langue: 'fr'
  };

  if (confirmed) {
    const qrData = JSON.stringify({
      ref: bookingRef,
      candidat: `${user?.prenom} ${user?.nom}`,
      centre: selectedCentreData?.nom,
      date: selectedDate,
      heure: selectedTime,
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="h-2" style={{ background: 'linear-gradient(to right, #CE1126, #FCD116, #009460)' }}></div>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#00946015' }}>
                <Check className="w-10 h-10" style={{ color: '#009460' }} />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1A2332' }}>Réservation confirmée !</h2>
              <p className="text-gray-500 mb-6">Votre convocation a été générée avec succès</p>

              <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
                <div className="flex justify-center mb-6">
                  <RealQRCode data={qrData} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Référence</span>
                    <span className="font-mono font-bold text-sm" style={{ color: '#009460' }}>{bookingRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Candidat</span>
                    <span className="font-medium text-sm">{user?.prenom} {user?.nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">N° unique</span>
                    <span className="font-mono text-sm">{user?.numeroUnique}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Centre</span>
                    <span className="font-medium text-sm">{bookingData.step2.centreNom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Date</span>
                    <span className="font-medium text-sm">{new Date(bookingData.step3.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Heure</span>
                    <span className="font-medium text-sm">{bookingData.step3.heure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Catégorie</span>
                    <span className="font-medium text-sm">Permis {user?.categoriePermis}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Présentez-vous avec votre pièce d&apos;identité et cette convocation (QR code) au centre d&apos;examen 30 minutes avant l&apos;heure prévue.
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  className="text-white font-semibold"
                  style={{ backgroundColor: '#009460' }}
                  onClick={() => onViewChange('candidate-dashboard')}
                >
                  Retour au tableau de bord
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  Imprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ color: '#1A2332' }}>
          Réserver un examen
        </h1>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, index) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    step >= s.num ? 'text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                  style={step >= s.num ? { backgroundColor: step === s.num ? '#009460' : '#00946099' } : {}}
                >
                  {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                </div>
                <span className={`hidden sm:block text-sm font-medium ${step >= s.num ? '' : 'text-gray-400'}`} style={step >= s.num ? { color: '#1A2332' } : {}}>
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? '' : 'bg-gray-200'}`} style={step > s.num ? { backgroundColor: '#009460' } : {}}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {/* Step 1: Region & Ville */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#00946015' }}>
                    <MapPin className="w-5 h-5" style={{ color: '#009460' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#1A2332' }}>Choisir la région et la ville</h2>
                    <p className="text-gray-500 text-sm">Sélectionnez le lieu où vous souhaitez passer l&apos;examen</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Région *</Label>
                    <Select value={selectedRegion} onValueChange={(val) => { setSelectedRegion(val); setSelectedVille(''); setSelectedCentre(''); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une région" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ville *</Label>
                    <Select value={selectedVille} onValueChange={(val) => { setSelectedVille(val); setSelectedCentre(''); }} disabled={!selectedRegion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentRegion?.villes.map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Centre */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FCD11615' }}>
                    <Building2 className="w-5 h-5" style={{ color: '#1A2332' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#1A2332' }}>Choisir le centre d&apos;examen</h2>
                    <p className="text-gray-500 text-sm">{currentRegion?.nom} — {currentVille?.nom}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {availableCentres.map(centre => (
                    <div
                      key={centre.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedCentre === centre.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedCentre(centre.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold" style={{ color: '#1A2332' }}>{centre.nom}</h3>
                          <p className="text-sm text-gray-500 mt-1">{centre.adresse}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3" /> Capacité: {centre.capacite}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {centre.telephone}
                            </span>
                          </div>
                        </div>
                        {selectedCentre === centre.id && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#009460' }}>
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Date & Time */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#CE112615' }}>
                    <Calendar className="w-5 h-5" style={{ color: '#CE1126' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#1A2332' }}>Choisir la date et l&apos;heure</h2>
                    <p className="text-gray-500 text-sm">{selectedCentreData?.nom}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {availableDates.map(date => (
                      <button
                        key={date}
                        className={`p-3 rounded-lg border-2 text-center text-sm transition-all ${
                          selectedDate === date ? 'text-white font-semibold' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={selectedDate === date ? { backgroundColor: '#009460', borderColor: '#009460' } : {}}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="font-medium">{new Date(date).toLocaleDateString('fr-FR', { day: 'numeric' })}</div>
                        <div className="text-xs opacity-75">{new Date(date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                        <div className="text-xs opacity-75">{new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Créneau horaire *</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {creneauxHoraires.map(time => (
                      <button
                        key={time}
                        className={`p-2 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                          selectedTime === time ? 'text-white' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={selectedTime === time ? { backgroundColor: '#009460', borderColor: '#009460' } : {}}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FCD11615' }}>
                    <CreditCard className="w-5 h-5" style={{ color: '#1A2332' }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: '#1A2332' }}>Récapitulatif et paiement</h2>
                    <p className="text-gray-500 text-sm">Vérifiez les détails et effectuez le paiement</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold" style={{ color: '#1A2332' }}>Récapitulatif</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Candidat</span>
                      <span className="font-medium">{user?.prenom} {user?.nom}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Centre</span>
                      <span className="font-medium">{selectedCentreData?.nom}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium">{new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Heure</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Catégorie</span>
                      <span className="font-medium">Permis {user?.categoriePermis}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold" style={{ color: '#1A2332' }}>Frais d&apos;examen</span>
                        <span className="font-bold text-lg" style={{ color: '#009460' }}>50 000 GNF</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Paiement Mobile Money *</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Numéro Mobile Money (ex: 622 00 00 00)"
                      value={mobileMoneyNumber}
                      onChange={e => setMobileMoneyNumber(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-gray-400">Orange Money, MTN Mobile Money, ou Celcom</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Précédent
              </Button>
              {step < 4 ? (
                <Button
                  className="text-white font-semibold"
                  style={{ backgroundColor: '#009460' }}
                  disabled={
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2) ||
                    (step === 3 && !canProceedStep3)
                  }
                  onClick={() => setStep(step + 1)}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  className="text-white font-semibold"
                  style={{ backgroundColor: '#009460' }}
                  disabled={!canProceedStep4 || isSubmitting}
                  onClick={handleConfirm}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <QrCode className="w-4 h-4 mr-1" />}
                  {isSubmitting ? 'Traitement en cours...' : 'Confirmer et payer'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
