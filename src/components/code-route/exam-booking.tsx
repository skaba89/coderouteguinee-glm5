'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Phone,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface ExamBookingProps {
  onViewChange: (view: ViewType) => void;
}

// Provider info for display
const providerInfo: Record<string, { name: string; color: string; ussd: string }> = {
  orange_money: { name: 'Orange Money', color: '#FF6600', ussd: '#144*1#' },
  mtn_money: { name: 'MTN Mobile Money', color: '#FFCC00', ussd: '*156*1#' },
  celcom_money: { name: 'Celcom Money', color: '#00A651', ussd: '*400*1#' },
};

// Detect provider from phone number
function detectProvider(phone: string): string | null {
  const cleaned = phone.replace(/[\s\-]/g, '').replace(/^\+224/, '');
  if (/^(622|621|620)/.test(cleaned)) return 'orange_money';
  if (/^(623|624|625)/.test(cleaned)) return 'celcom_money';
  if (/^(626|627|628)/.test(cleaned)) return 'mtn_money';
  return null;
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

type PaymentStep = 'idle' | 'initiating' | 'pending' | 'verifying' | 'confirmed' | 'failed';

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

  // Payment state
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('idle');
  const [paymentError, setPaymentError] = useState('');
  const [detectedProvider, setDetectedProvider] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [ussdCode, setUssdCode] = useState('');

  const availableDates = getUpcomingDates();
  const currentRegion = regions.find(r => r.id === selectedRegion);
  const currentVille = currentRegion?.villes.find(v => v.id === selectedVille);
  const availableCentres = currentVille?.centres || centres.filter(c => c.region === (currentRegion?.nom || ''));
  const selectedCentreData = centres.find(c => c.id === selectedCentre);

  const canProceedStep1 = selectedRegion && selectedVille;
  const canProceedStep2 = selectedCentre;
  const canProceedStep3 = selectedDate && selectedTime;

  // Validate Mobile Money number
  const validatePhoneNumber = useCallback((phone: string): { valid: boolean; error?: string } => {
    const cleaned = phone.replace(/[\s\-]/g, '').replace(/^\+224/, '');
    if (cleaned.length < 9) return { valid: false, error: 'Numéro incomplet' };
    if (!/^\d{9}$/.test(cleaned)) return { valid: false, error: 'Format invalide' };
    const provider = detectProvider(phone);
    if (!provider) {
      return { valid: false, error: 'Préfixe non reconnu. Utilisez Orange (622/621/620), Celcom (623/624/625) ou MTN (626/627/628)' };
    }
    return { valid: true };
  }, []);

  const phoneValidation = mobileMoneyNumber.length >= 3 ? validatePhoneNumber(mobileMoneyNumber) : { valid: false };
  const canProceedStep4 = mobileMoneyNumber.length >= 9 && phoneValidation.valid;

  // Detect provider as user types
  useEffect(() => {
    if (mobileMoneyNumber.length >= 3) {
      setDetectedProvider(detectProvider(mobileMoneyNumber));
    } else {
      setDetectedProvider(null);
    }
  }, [mobileMoneyNumber]);

  const steps = [
    { num: 1, label: 'Région & Ville', icon: MapPin },
    { num: 2, label: 'Centre', icon: Building2 },
    { num: 3, label: 'Date & Heure', icon: Calendar },
    { num: 4, label: 'Paiement', icon: CreditCard },
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState<string>('');
  const [bookingId, setBookingId] = useState<string>('');

  // ─── Initiate Mobile Money Payment ────────────────────────
  const handleConfirm = async () => {
    setIsSubmitting(true);
    setPaymentStep('initiating');
    setPaymentError('');

    try {
      // Step 1: Create booking
      const bookingRes = await fetch('/api/bookings', {
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

      if (!bookingRes.ok) {
        const errData = await bookingRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur lors de la création de la réservation');
      }

      const bookingData = await bookingRes.json();
      const newBookingId = bookingData.id;
      const newBookingRef = bookingData.numeroConvocation;
      setBookingId(newBookingId);
      setBookingRef(newBookingRef);

      // Step 2: Initiate Mobile Money payment
      setPaymentStep('pending');
      const paymentRes = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: newBookingId,
          phoneNumber: mobileMoneyNumber,
          amount: 50000,
        }),
      });

      const paymentData = await paymentRes.json();

      if (!paymentRes.ok || !paymentData.success) {
        throw new Error(paymentData.error || 'Le paiement a échoué');
      }

      setTransactionRef(paymentData.transactionRef);
      setUssdCode(paymentData.ussdCode || '');

      // Step 3: Start polling for payment confirmation
      pollPaymentStatus(paymentData.transactionRef);

    } catch (error) {
      console.error('Booking/payment error:', error);
      setPaymentStep('failed');
      setPaymentError(error instanceof Error ? error.message : 'Une erreur est survenue');
      // If booking was created but payment failed, still show reference
      if (bookingRef) {
        setPaymentError(error instanceof Error ? error.message : 'Le paiement a échoué, mais votre réservation a été créée.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Poll payment status ──────────────────────────────────
  const pollPaymentStatus = useCallback((ref: string) => {
    let attempts = 0;
    const maxAttempts = 20; // 20 * 3s = 60 seconds max
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionRef: ref }),
        });
        const data = await res.json();

        if (data.status === 'confirmed') {
          clearInterval(interval);
          setPaymentStep('confirmed');
          setConfirmed(true);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setPaymentStep('failed');
          setPaymentError('Le paiement a été refusé. Veuillez réessayer.');
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          // In sandbox, auto-confirm after timeout
          if (process.env.NODE_ENV !== 'production') {
            setPaymentStep('confirmed');
            setConfirmed(true);
          } else {
            setPaymentStep('failed');
            setPaymentError('Délai de confirmation dépassé. Veuillez vérifier votre paiement et réessayer.');
          }
        }
      } catch {
        // Network error — continue polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const bookingData: BookingData = {
    step1: { region: currentRegion?.nom || '', ville: currentVille?.nom || '' },
    step2: { centreId: selectedCentre, centreNom: selectedCentreData?.nom || '' },
    step3: { date: selectedDate, heure: selectedTime },
    langue: 'fr'
  };

  // ─── Confirmed View ───────────────────────────────────────
  if (confirmed) {
    const qrData = JSON.stringify({
      ref: bookingRef,
      candidat: `${user?.prenom} ${user?.nom}`,
      centre: selectedCentreData?.nom,
      date: selectedDate,
      heure: selectedTime,
      transaction: transactionRef,
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
              <p className="text-gray-500 mb-6">Votre convocation a été générée et le paiement a été confirmé</p>

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
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Paiement</span>
                      <span className="font-medium text-sm" style={{ color: '#009460' }}>Confirmé</span>
                    </div>
                  </div>
                  {detectedProvider && providerInfo[detectedProvider] && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Opérateur</span>
                      <span className="font-medium text-sm" style={{ color: providerInfo[detectedProvider].color }}>
                        {providerInfo[detectedProvider].name}
                      </span>
                    </div>
                  )}
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
                <Button
                  variant="outline"
                  onClick={() => {
                    if (bookingId) {
                      window.open(`/api/convocation/${bookingId}`, '_blank');
                    }
                  }}
                  disabled={!bookingId}
                >
                  Telecharger PDF
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

  // ─── Payment Pending View ─────────────────────────────────
  if (paymentStep === 'pending') {
    const provider = detectedProvider && providerInfo[detectedProvider];
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-12">
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="h-2" style={{ background: 'linear-gradient(to right, #CE1126, #FCD116, #009460)' }}></div>
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: '#FCD11615' }}>
                <Phone className="w-10 h-10 animate-pulse" style={{ color: '#FCD116' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#1A2332' }}>Confirmez le paiement</h2>
              <p className="text-gray-500 mb-6">
                Un SMS de confirmation a été envoyé au <span className="font-semibold">{mobileMoneyNumber}</span>
              </p>

              {provider && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${provider.color}20` }}>
                      <Smartphone className="w-5 h-5" style={{ color: provider.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{provider.name}</p>
                      <p className="text-xs text-gray-500">50 000 GNF</p>
                    </div>
                  </div>

                  {ussdCode && (
                    <div className="bg-white border rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Code USSD pour confirmer :</p>
                      <p className="font-mono font-bold text-lg text-center" style={{ color: provider.color }}>
                        {ussdCode}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Vérification du paiement en cours...
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-2">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800 text-left">
                  Vérifiez votre téléphone et entrez votre code PIN Mobile Money pour confirmer le paiement. La confirmation est automatique.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPaymentStep('idle');
                  setPaymentError('');
                }}
              >
                Annuler
              </Button>
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
                    <p className="text-gray-500 text-sm">Vérifiez les détails et effectuez le paiement Mobile Money</p>
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

                {/* Mobile Money Provider Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Paiement Mobile Money *</Label>

                  {/* Provider badges */}
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(providerInfo).map(([id, info]) => (
                      <div
                        key={id}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          detectedProvider === id ? 'bg-gray-50' : 'bg-gray-50 border-transparent opacity-60'
                        }`}
                        style={detectedProvider === id ? { borderColor: info.color } : {}}
                      >
                        <Smartphone className="w-5 h-5 mx-auto mb-1" style={{ color: info.color }} />
                        <p className="text-xs font-semibold" style={{ color: info.color }}>{info.name}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile-money-number">Numéro Mobile Money</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="mobile-money-number"
                        placeholder="622 00 00 00"
                        value={mobileMoneyNumber}
                        onChange={e => {
                          setMobileMoneyNumber(e.target.value);
                          setPaymentError('');
                        }}
                        className="pl-10"
                        maxLength={15}
                      />
                      {detectedProvider && providerInfo[detectedProvider] && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${providerInfo[detectedProvider].color}15`, color: providerInfo[detectedProvider].color }}
                          >
                            {providerInfo[detectedProvider].name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Validation feedback */}
                    {mobileMoneyNumber.length >= 3 && !phoneValidation.valid && phoneValidation.error && (
                      <p className="text-xs text-red-500">{phoneValidation.error}</p>
                    )}
                    {mobileMoneyNumber.length >= 9 && phoneValidation.valid && detectedProvider && (
                      <p className="text-xs" style={{ color: '#009460' }}>
                        ✓ {providerInfo[detectedProvider]?.name} détecté — Paiement sécurisé
                      </p>
                    )}
                  </div>

                  {/* Security notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800">
                      Votre paiement est sécurisé. Vous recevrez une notification sur votre téléphone pour confirmer la transaction via votre code PIN Mobile Money.
                    </p>
                  </div>
                </div>

                {/* Payment error */}
                {paymentError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{paymentError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1 || isSubmitting}
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-1" />
                      Payer 50 000 GNF
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
