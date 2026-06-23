'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { useLang } from '@/i18n';
import { useCitizen } from '@/citizenAuth';
import { uuidv7, todayISO } from '@/store';
import { feedback } from '@/data';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function FeedbackPage() {
  const { t } = useLang();
  const { account } = useCitizen();
  const [msg, setMsg] = useState('');

  if (!account) {
    return (
      <div className="mx-auto max-w-xl">
        <Card>
          <CardContent className="space-y-4 pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t(
                'Mag-sign in muna para magpadala ng feedback at masubaybayan ito.',
                'Sign in first to send feedback and track it.',
              )}
            </p>
            <Link href="/portal/account" className={buttonVariants({ variant: 'outline' })}>
              {t('Mag-sign in', 'Sign in')}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  function send() {
    if (!msg.trim() || !account) return;
    // Offline-durable: enqueues a citizen-scoped create mutation (accountId === me).
    feedback.add({
      id: uuidv7(),
      accountId: account.id,
      name: account.name,
      message: msg.trim(),
      createdAt: todayISO(),
    });
    setMsg('');
    toast.success(t('Naipadala — masusync kapag online.', 'Submitted — will sync when online.'), {
      description: t(
        'Susuriin ito ng Sekretariat ng Sangguniang Bayan.',
        'The Sangguniang Bayan Secretariat will review it.',
      ),
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-2">
        <Send className="size-5 text-primary" />
        <h1 className="font-heading text-xl font-semibold">{t('Magpadala ng feedback', 'Share feedback')}</h1>
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="message">{t('Mensahe', 'Message')}</Label>
            <textarea
              id="message"
              rows={5}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder={t('Isulat ang iyong puna o mungkahi…', 'Your concern, suggestion, or inquiry…')}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {t('Bilang', 'As')}: {account.name}
            </p>
            <Button onClick={send} disabled={!msg.trim()}>
              <Send className="size-4" /> {t('Ipadala', 'Submit feedback')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
