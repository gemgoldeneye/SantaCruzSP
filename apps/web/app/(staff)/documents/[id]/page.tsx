'use client';

import { useParams } from 'next/navigation';
import { DocumentDetail as DocumentDetailView } from '@/components/document-detail';
import { useLegacyDocuments } from '@/hooks/data';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const doc = useLegacyDocuments().find((d) => d.id === id) ?? null;
  return <DocumentDetailView doc={doc} />;
}
