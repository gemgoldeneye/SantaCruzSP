import { DocumentDetail } from "@/components/document-detail";
import { PageHeader } from "@/components/page-header";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <PageHeader
        title="Document"
        description="Full record detail, OCR status, and extracted text."
      />
      <DocumentDetail id={id} />
    </>
  );
}
