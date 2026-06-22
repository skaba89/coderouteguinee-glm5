'use client';

// ============================================================
// CodeRoute Guinée — Orange SMS Test Panel (Phase 29)
// ============================================================
// Admin UI to:
//   1. View Orange SMS OAuth2 configuration status
//   2. Send a test SMS to verify connectivity
//   3. Display remaining quota and message ID
//   4. Show diagnostic info (elapsed time, timestamp)
//
// Lives inside the Notifications Manager page.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2, Send, MessageSquare, CheckCircle, XCircle,
  Phone, Activity, Info, AlertTriangle,
} from 'lucide-react';

const COLORS = {
  primaryDark: '#1A2332',
  red: '#CE1126',
  yellow: '#FCD116',
  green: '#009460',
};

interface OrangeSmsStatus {
  configured: boolean;
  provider: 'orange' | 'console';
  apiBase: string;
  senderAddress: string | null;
  clientIdMasked: string | null;
  help: string;
  envVars: {
    ORANGE_SMS_CLIENT_ID: boolean;
    ORANGE_SMS_CLIENT_SECRET: boolean;
    ORANGE_SMS_SENDER_ADDRESS: boolean;
    ORANGE_SMS_API_BASE: boolean;
  };
}

interface TestResult {
  success: boolean;
  provider: 'orange' | 'console';
  messageId?: string;
  error?: string;
  remainingQuota?: number;
  normalizedPhone: string;
  diagnostic: {
    elapsedMs: number;
    configured: boolean;
    timestamp: string;
  };
  message: string;
}

export function OrangeSmsPanel() {
  const [status, setStatus] = useState<OrangeSmsStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/admin/notifications/orange-sms', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      console.error('[OrangeSmsPanel] status error:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  async function handleSendTest(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/notifications/orange-sms', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({
        success: false,
        provider: 'orange',
        error: err.message,
        normalizedPhone: phone,
        message: `Erreur réseau: ${err.message}`,
        diagnostic: { elapsedMs: 0, configured: false, timestamp: new Date().toISOString() },
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base" style={{ color: COLORS.primaryDark }}>
          <MessageSquare className="h-4 w-4" style={{ color: COLORS.yellow }} />
          Orange SMS — OAuth2 (Phase 29)
        </CardTitle>
        {status && (
          <Badge variant={status.configured ? 'default' : 'secondary'}
            style={status.configured
              ? { backgroundColor: COLORS.green, color: 'white' }
              : { backgroundColor: '#6b7280', color: 'white' }}>
            {status.configured ? 'Configuré' : 'Console (dev)'}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingStatus ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Vérification de la configuration…
          </div>
        ) : status ? (
          <>
            {/* Status info */}
            <div className="rounded-md border p-3 text-sm bg-muted/30">
              <div className="flex items-start gap-2 mb-2">
                <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-600" />
                <p className="text-muted-foreground">{status.help}</p>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 font-mono text-xs">
                <dt className="text-muted-foreground">API base</dt>
                <dd>{status.apiBase}</dd>
                {status.senderAddress && (
                  <>
                    <dt className="text-muted-foreground">Sender</dt>
                    <dd>{status.senderAddress}</dd>
                  </>
                )}
                {status.clientIdMasked && (
                  <>
                    <dt className="text-muted-foreground">Client ID</dt>
                    <dd>{status.clientIdMasked}</dd>
                  </>
                )}
              </dl>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {Object.entries(status.envVars).map(([k, v]) => (
                  <Badge key={k} variant="outline" className="text-xs font-mono"
                    style={{
                      borderColor: v ? COLORS.green : COLORS.red,
                      color: v ? COLORS.green : COLORS.red,
                    }}>
                    {v ? '✓' : '✗'} {k.replace('ORANGE_SMS_', '')}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Test form */}
            <form onSubmit={handleSendTest} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="orange-sms-phone" className="text-xs font-medium">
                  Numéro de téléphone (Guinée)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="orange-sms-phone"
                    type="tel"
                    placeholder="+224 628 12 34 56"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                    required
                    disabled={sending}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Formats acceptés: 628123456, 0628123456, +224628123456, 224 628 12 34 56
                </p>
              </div>

              <Button type="submit" disabled={sending || !phone.trim()}
                className="w-full"
                style={{ backgroundColor: COLORS.yellow, color: COLORS.primaryDark }}>
                {sending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi en cours…</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Envoyer un SMS de test</>
                )}
              </Button>
            </form>

            {/* Result */}
            {result && (
              <div className="rounded-md border p-3 space-y-2 text-sm"
                style={{
                  borderColor: result.success ? COLORS.green : COLORS.red,
                  backgroundColor: result.success ? 'rgba(0,148,96,0.05)' : 'rgba(206,17,38,0.05)',
                }}>
                <div className="flex items-start gap-2">
                  {result.success
                    ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: COLORS.green }} />
                    : <XCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: COLORS.red }} />}
                  <div className="flex-1">
                    <p className="font-medium">{result.message}</p>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 font-mono text-xs">
                      <dt className="text-muted-foreground">Provider</dt>
                      <dd>{result.provider}</dd>
                      {result.messageId && (
                        <>
                          <dt className="text-muted-foreground">Message ID</dt>
                          <dd>{result.messageId}</dd>
                        </>
                      )}
                      {typeof result.remainingQuota === 'number' && (
                        <>
                          <dt className="text-muted-foreground">Quota restant</dt>
                          <dd>{result.remainingQuota}</dd>
                        </>
                      )}
                      <dt className="text-muted-foreground">Numéro normalisé</dt>
                      <dd>{result.normalizedPhone}</dd>
                      <dt className="text-muted-foreground">Durée</dt>
                      <dd>{result.diagnostic.elapsedMs} ms</dd>
                      <dt className="text-muted-foreground">Timestamp</dt>
                      <dd>{new Date(result.diagnostic.timestamp).toLocaleString('fr-FR')}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {!status.configured && (
              <div className="rounded-md border p-3 text-xs flex items-start gap-2"
                style={{ borderColor: COLORS.yellow, backgroundColor: 'rgba(252,209,22,0.08)' }}>
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: COLORS.yellow }} />
                <div className="space-y-1">
                  <p className="font-medium">Mode développement (console)</p>
                  <p className="text-muted-foreground">
                    Les SMS sont simplement affichés dans les logs serveur.
                    Pour activer l'envoi réel, configurez les variables d'environnement
                    Orange SMS OAuth2 et redémarrez le serveur.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Impossible de charger la configuration.</p>
        )}
      </CardContent>
    </Card>
  );
}
