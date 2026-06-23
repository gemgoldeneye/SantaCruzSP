'use client';

import { TrackingBoard } from '@/components/tracking-board';
import { useLegacyDocuments, useLegacyVotes } from '@/hooks/data';

export default function TrackingPage() {
  return <TrackingBoard documents={useLegacyDocuments()} votes={useLegacyVotes()} />;
}
