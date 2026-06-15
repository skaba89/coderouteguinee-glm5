// ============================================================
// CodeRoute Guinée — Mobile Money Payment Integration
// Supports: Orange Money, MTN Mobile Money, Celcom Money
// ============================================================

import { db } from '@/lib/db';

// ─── Mobile Money Provider Configuration ───────────────────
interface MobileMoneyProvider {
  id: string;
  name: string;
  color: string;
  prefixes: string[]; // Phone number prefixes for detection
  minAmount: number;  // GNF
  maxAmount: number;  // GNF
  apiUrl: string;     // API endpoint (sandbox/production)
  apiKey: string;     // API key from env
}

const providers: MobileMoneyProvider[] = [
  {
    id: 'orange_money',
    name: 'Orange Money',
    color: '#FF6600',
    prefixes: ['622', '621', '620'],
    minAmount: 1000,
    maxAmount: 5000000,
    apiUrl: process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com/om/equity/v1',
    apiKey: process.env.ORANGE_MONEY_API_KEY || '',
  },
  {
    id: 'mtn_money',
    name: 'MTN Mobile Money',
    color: '#FFCC00',
    prefixes: ['623', '624', '625'],
    minAmount: 1000,
    maxAmount: 5000000,
    apiUrl: process.env.MTN_MONEY_API_URL || 'https://api.mtn.com/collection/v1',
    apiKey: process.env.MTN_MONEY_API_KEY || '',
  },
  {
    id: 'celcom_money',
    name: 'Celcom Money',
    color: '#00A651',
    prefixes: ['626', '627', '628'],
    minAmount: 1000,
    maxAmount: 3000000,
    apiUrl: process.env.CELCOM_MONEY_API_URL || 'https://api.celcom.com/payment/v1',
    apiKey: process.env.CELCOM_MONEY_API_KEY || '',
  },
];

// ─── Detect provider from phone number ─────────────────────
export function detectProvider(phoneNumber: string): MobileMoneyProvider | null {
  // Clean the phone number — remove spaces, dashes, and +224 prefix
  const cleaned = phoneNumber.replace(/[\s\-]/g, '').replace(/^\+224/, '');
  
  for (const provider of providers) {
    for (const prefix of provider.prefixes) {
      if (cleaned.startsWith(prefix)) {
        return provider;
      }
    }
  }
  return null;
}

// ─── Validate phone number for Mobile Money ────────────────
export function validateMobileMoneyNumber(phoneNumber: string): { valid: boolean; error?: string; provider?: MobileMoneyProvider } {
  // Clean the phone number
  const cleaned = phoneNumber.replace(/[\s\-]/g, '').replace(/^\+224/, '');
  
  // Must be 9 digits (Guinea format)
  if (!/^\d{9}$/.test(cleaned)) {
    return { valid: false, error: 'Le numéro doit contenir exactement 9 chiffres (format guinéen)' };
  }
  
  const provider = detectProvider(phoneNumber);
  if (!provider) {
    return { 
      valid: false, 
      error: 'Numéro non reconnu. Utilisez un numéro Orange Money (622/621/620), MTN (623/624/625) ou Celcom (626/627/628)' 
    };
  }
  
  return { valid: true, provider };
}

// ─── Payment request interface ─────────────────────────────
interface PaymentRequest {
  bookingId: string;
  phoneNumber: string;
  amount: number; // GNF
  provider: MobileMoneyProvider;
}

interface PaymentResult {
  success: boolean;
  transactionRef?: string;
  status: 'pending' | 'confirmed' | 'failed';
  message: string;
  providerName: string;
  ussdCode?: string; // USSD code for the user to confirm payment
}

// ─── Initiate a Mobile Money payment ───────────────────────
export async function initiateMobileMoneyPayment(params: {
  bookingId: string;
  phoneNumber: string;
  amount: number;
}): Promise<PaymentResult> {
  const { bookingId, phoneNumber, amount } = params;

  // Validate phone number
  const validation = validateMobileMoneyNumber(phoneNumber);
  if (!validation.valid || !validation.provider) {
    return {
      success: false,
      status: 'failed',
      message: validation.error || 'Numéro invalide',
      providerName: 'Inconnu',
    };
  }

  const provider = validation.provider;

  // Validate amount
  if (amount < provider.minAmount || amount > provider.maxAmount) {
    return {
      success: false,
      status: 'failed',
      message: `Montant invalide. Minimum: ${provider.minAmount.toLocaleString()} GNF, Maximum: ${provider.maxAmount.toLocaleString()} GNF`,
      providerName: provider.name,
    };
  }

  // Verify booking exists
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return {
      success: false,
      status: 'failed',
      message: 'Réservation introuvable',
      providerName: provider.name,
    };
  }

  // Verify booking is not already paid
  if (booking.statutPaiement === 'confirme') {
    return {
      success: false,
      status: 'failed',
      message: 'Cette réservation est déjà payée',
      providerName: provider.name,
    };
  }

  // Generate transaction reference
  const transactionRef = `MM-${provider.id.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  try {
    // ─── Provider-specific API integration ──────────────────
    // In production, these would make real HTTP requests to the provider APIs.
    // For now, we simulate the API call based on the provider.
    
    let apiResult: { success: boolean; transactionId: string; ussdCode?: string };

    if (provider.apiKey) {
      // If API key is configured, attempt real API call
      apiResult = await callProviderApi(provider, {
        bookingId,
        phoneNumber,
        amount,
        transactionRef,
      });
    } else {
      // Sandbox/development mode — simulate successful payment initiation
      apiResult = simulateProviderApi(provider, phoneNumber, amount);
    }

    if (!apiResult.success) {
      // Update booking with failed status
      await db.booking.update({
        where: { id: bookingId },
        data: {
          statutPaiement: 'echoue',
          numeroPaiement: phoneNumber,
          referencePaiement: transactionRef,
        },
      });

      return {
        success: false,
        status: 'failed',
        message: 'Le paiement a échoué. Veuillez réessayer.',
        providerName: provider.name,
      };
    }

    // Payment initiated successfully — update booking
    await db.booking.update({
      where: { id: bookingId },
      data: {
        statutPaiement: 'en_attente',
        numeroPaiement: phoneNumber,
        referencePaiement: apiResult.transactionId || transactionRef,
        moyenPaiement: `mobile_money_${provider.id}`,
      },
    });

    return {
      success: true,
      transactionRef: apiResult.transactionId || transactionRef,
      status: 'pending',
      message: `Paiement initié via ${provider.name}. Veuillez confirmer sur votre téléphone.`,
      providerName: provider.name,
      ussdCode: apiResult.ussdCode,
    };
  } catch (error) {
    console.error('Mobile Money payment error:', error);
    return {
      success: false,
      status: 'failed',
      message: 'Erreur lors de l\'initiation du paiement. Veuillez réessayer.',
      providerName: provider.name,
    };
  }
}

// ─── Call real provider API ────────────────────────────────
async function callProviderApi(
  provider: MobileMoneyProvider,
  params: {
    bookingId: string;
    phoneNumber: string;
    amount: number;
    transactionRef: string;
  }
): Promise<{ success: boolean; transactionId: string; ussdCode?: string }> {
  try {
    const response = await fetch(`${provider.apiUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`,
        'X-Reference-Id': params.transactionRef,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: 'GNF',
        externalId: params.bookingId,
        payee: {
          partyIdType: 'MSISDN',
          partyId: `224${params.phoneNumber.replace(/[\s\-]/g, '').replace(/^\+224/, '')}`,
        },
        payerMessage: 'CodeRoute Guinée - Frais examen code de la route',
        payeeNote: params.transactionRef,
      }),
    });

    if (!response.ok) {
      console.error(`Provider ${provider.name} API error:`, response.status);
      return { success: false, transactionId: '' };
    }

    const data = await response.json();
    return {
      success: true,
      transactionId: data.transactionId || params.transactionRef,
      ussdCode: getUssdCode(provider),
    };
  } catch (error) {
    console.error(`Provider ${provider.name} API call failed:`, error);
    return { success: false, transactionId: '' };
  }
}

// ─── Simulate provider API (sandbox/development) ───────────
function simulateProviderApi(
  provider: MobileMoneyProvider,
  _phoneNumber: string,
  _amount: number
): { success: boolean; transactionId: string; ussdCode?: string } {
  // Simulate a 95% success rate
  const success = Math.random() > 0.05;
  
  return {
    success,
    transactionId: `SIM-${provider.id.toUpperCase()}-${Date.now()}`,
    ussdCode: getUssdCode(provider),
  };
}

// ─── Get USSD code for provider ────────────────────────────
function getUssdCode(provider: MobileMoneyProvider): string {
  switch (provider.id) {
    case 'orange_money':
      return '#144*1#';
    case 'mtn_money':
      return '*156*1#';
    case 'celcom_money':
      return '*400*1#';
    default:
      return '';
  }
}

// ─── Verify/confirm a payment ──────────────────────────────
export async function verifyPayment(transactionRef: string): Promise<{
  status: 'pending' | 'confirmed' | 'failed';
  message: string;
}> {
  const booking = await db.booking.findFirst({
    where: { referencePaiement: transactionRef },
  });

  if (!booking) {
    return { status: 'failed', message: 'Transaction introuvable' };
  }

  // In production, we would check with the provider API
  // For sandbox, simulate: if more than 30 seconds have passed, consider it confirmed
  const bookingAge = Date.now() - booking.createdAt.getTime();
  
  if (booking.statutPaiement === 'confirme') {
    return { status: 'confirmed', message: 'Paiement confirmé' };
  }

  if (booking.statutPaiement === 'echoue') {
    return { status: 'failed', message: 'Le paiement a échoué' };
  }

  // Auto-confirm in sandbox after 30 seconds
  if (process.env.NODE_ENV !== 'production' && bookingAge > 30000) {
    await db.booking.update({
      where: { id: booking.id },
      data: {
        statutPaiement: 'confirme',
        confirmee: true,
      },
    });
    return { status: 'confirmed', message: 'Paiement confirmé (sandbox)' };
  }

  return { status: 'pending', message: 'En attente de confirmation sur votre téléphone' };
}

// ─── Get provider info for frontend display ────────────────
export function getProviderInfo(providerId: string) {
  return providers.find(p => p.id === providerId) || null;
}

export function getAllProviders() {
  return providers.map(p => ({
    id: p.id,
    name: p.name,
    color: p.color,
    prefixes: p.prefixes,
  }));
}
