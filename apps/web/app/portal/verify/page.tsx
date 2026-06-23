'use client';

import { useState } from 'react';
import { QrCode, ShieldCheck } from 'lucide-react';
import { useLang } from '@/i18n';
import { api, type VerifyResult } from '@/portal-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function VerifyPage() {
  const { t } = useLang();
  const [no, setNo] = useState('');
  const [res, setRes] = useState<VerifyResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  async function check() {
    if (!no.trim()) return;
    setBusy(true);
    setErr(false);
    setRes(null);
    try {
      setRes(await api.verify(no.trim()));
    } catch {
      setErr(true);
    } finally {
      setBusy(false);
    }
  }

  const statusVariant = (s?: string): 'default' | 'secondary' | 'destructive' =>
    s === 'active' ? 'default' : s === 'expiring' ? 'secondary' : 'destructive';

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <QrCode className="size-5 text-primary" />
          <h1 className="font-heading text-xl font-semibold">
            {t('Tsekin ang MTOP', 'Verify a tricycle franchise')}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {t(
            'Ilagay ang MTOP control number na nakasaad sa prankisa.',
            'Enter the MTOP control number printed on the franchise.',
          )}
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={no}
          onChange={(e) => setNo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void check();
          }}
          placeholder="MTOP-STC-…"
          className="h-10"
        />
        <Button className="h-10 px-4" onClick={() => void check()} disabled={busy}>
          <ShieldCheck className="size-4" /> {busy ? t('Tinutsek…', 'Checking…') : t('Tsekin', 'Verify')}
        </Button>
      </div>

      {err && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {t('Hindi makonekta sa server.', 'Could not reach the server.')}
          </CardContent>
        </Card>
      )}
      {res && !res.found && (
        <Card>
          <CardContent className="pt-6">
            <Badge variant="destructive">{t('Hindi nahanap', 'Not found')}</Badge>
          </CardContent>
        </Card>
      )}
      {res && res.found && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="font-mono text-base">{res.no}</CardTitle>
              <Badge variant={statusVariant(res.status)}>{res.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">{t('Operator', 'Operator')}:</span> {res.operator}
            </div>
            <div>
              <span className="text-muted-foreground">{t('Yunit', 'Unit')}:</span> {res.unit}
            </div>
            <div>
              <span className="text-muted-foreground">{t('Bisa hanggang', 'Valid until')}:</span> {res.validTo}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
