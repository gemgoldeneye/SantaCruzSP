'use client';

import { useState } from 'react';
import { LogIn, LogOut, UserRound } from 'lucide-react';
import { useLang } from '@/i18n';
import { useCitizen } from '@/citizenAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AccountPage() {
  const { t } = useLang();
  const { account, ready, requestOtp, verify, logout } = useCitizen();
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'mobile' | 'code'>('mobile');
  const [devCode, setDevCode] = useState<string | undefined>();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <div className="py-16 text-center text-sm text-muted-foreground">…</div>;

  if (account) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-2">
          <UserRound className="size-5 text-primary" />
          <h1 className="font-heading text-xl font-semibold">{t('Aking akawnt', 'My account')}</h1>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg">{account.name}</CardTitle>
                <div className="font-mono text-sm text-muted-foreground">{account.mobile}</div>
              </div>
              {account.verified ? (
                <Badge>{t('Beripikado', 'Verified')}</Badge>
              ) : (
                <Badge variant="secondary">{t('Hindi pa beripikado', 'Unverified')}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => void logout()}>
              <LogOut className="size-4" /> {t('Mag-logout', 'Sign out')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function sendCode() {
    setBusy(true);
    setErr(null);
    try {
      setDevCode(await requestOtp(mobile));
      setStep('code');
    } catch {
      setErr(t('Hindi maipadala ang code', 'Could not send code'));
    } finally {
      setBusy(false);
    }
  }
  async function doVerify() {
    setBusy(true);
    setErr(null);
    try {
      await verify(mobile, code, name || undefined);
    } catch (e) {
      const status = (e as { status?: number }).status;
      setErr(status === 409 ? t('Kailangan ang pangalan', 'Name is required') : t('Maling code', 'Invalid code'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <LogIn className="size-5 text-primary" />
          <h1 className="font-heading text-xl font-semibold">{t('Mag-sign in', 'Sign in')}</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('Gamit ang numero ng cellphone (OTP).', 'Using your mobile number (OTP).')}
        </p>
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          {step === 'mobile' ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="mobile">{t('Numero ng cellphone', 'Mobile number')}</Label>
                <Input
                  id="mobile"
                  className="h-10"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="09XXXXXXXXX"
                  inputMode="numeric"
                />
              </div>
              <Button className="w-full" onClick={() => void sendCode()} disabled={busy || mobile.length < 10}>
                {t('Magpadala ng code', 'Send code')}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="code">{t('Code (OTP)', 'Code (OTP)')}</Label>
                <Input
                  id="code"
                  className="h-10"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  inputMode="numeric"
                />
                {devCode && (
                  <p className="text-xs text-muted-foreground">
                    {t('Dev code', 'Dev code')}: <b>{devCode}</b>
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">{t('Pangalan (kung bago)', 'Name (if new)')}</Label>
                <Input id="name" className="h-10" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <Button className="w-full" onClick={() => void doVerify()} disabled={busy || code.length < 4}>
                {t('Magpatunay', 'Verify')}
              </Button>
            </>
          )}
          {err && <p className="text-sm font-medium text-destructive">{err}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
