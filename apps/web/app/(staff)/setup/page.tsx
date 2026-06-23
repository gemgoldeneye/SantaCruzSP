'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { RefDataManager } from '@/components/setup/ref-data-manager';
import { CommitteesManager } from '@/components/setup/committees-manager';
import { zones, todas, fees, appDocs } from '@/data';
import { cn } from '@/lib/utils';

const TABS = ['Committees', 'Zones', 'TODAs', 'Fees', 'Documents'] as const;
type Tab = (typeof TABS)[number];

export default function SetupPage() {
  const [tab, setTab] = useState<Tab>('Committees');

  return (
    <>
      <PageHeader
        title="Setup"
        description="Set up your committees and tricycle-franchising reference data. (Your Sangguniang Bayan roster lives in Accounts — add an account with the Presiding Officer or Member role.) Everything here is created and maintained by your office."
      />

      <div className="mb-4 flex flex-wrap gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Committees' && <CommitteesManager />}

      {tab === 'Zones' && (
        <RefDataManager
          collection={zones}
          addLabel="Add zone"
          emptyText="No franchise zones yet. Add your MTOP zones / barangays."
          defaults={{ name: '', kind: 'Rural', cap: 50, used: 0, frozen: false }}
          fields={[
            { key: 'name', label: 'Zone / barangay', type: 'text', required: true },
            { key: 'kind', label: 'Kind', type: 'select', options: [
              { value: 'Poblacion', label: 'Poblacion' }, { value: 'Rural', label: 'Rural' },
            ] },
            { key: 'cap', label: 'Cap', type: 'number' },
            { key: 'used', label: 'Used', type: 'number' },
            { key: 'frozen', label: 'Frozen (no new franchises)', type: 'checkbox' },
          ]}
          renderRow={(z) => (
            <>
              <div className="font-medium">{z.name}</div>
              <div className="truncate text-xs text-muted-foreground">{z.kind} · {z.used}/{z.cap}{z.frozen ? ' · frozen' : ''}</div>
            </>
          )}
        />
      )}

      {tab === 'TODAs' && (
        <RefDataManager
          collection={todas}
          addLabel="Add TODA"
          emptyText="No TODAs yet. Add your tricycle operators' associations."
          defaults={{ name: '' }}
          fields={[{ key: 'name', label: 'TODA name', type: 'text', required: true }]}
          renderRow={(t) => <div className="font-medium">{t.name}</div>}
        />
      )}

      {tab === 'Fees' && (
        <RefDataManager
          collection={fees}
          addLabel="Add fee"
          emptyText="No fees yet. Add your MTOP fee schedule."
          defaults={{ appType: 'NEW_MTOP', label: '', amount: 0, confirmed: true, sortOrder: 1 }}
          fields={[
            { key: 'appType', label: 'Application type', type: 'select', options: [
              { value: 'NEW_MTOP', label: 'New MTOP' }, { value: 'RENEWAL', label: 'Renewal' },
              { value: 'CHANGE_MOTOR', label: 'Change of Motor' }, { value: 'DROPPING', label: 'Dropping' },
            ] },
            { key: 'label', label: 'Label', type: 'text', required: true, placeholder: 'New MTOP' },
            { key: 'amount', label: 'Amount (PHP)', type: 'number' },
            { key: 'sortOrder', label: 'Sort order', type: 'number' },
            { key: 'confirmed', label: 'Confirmed', type: 'checkbox' },
          ]}
          renderRow={(f) => (
            <>
              <div className="font-medium">{f.label} <span className="text-muted-foreground">({f.appType})</span></div>
              <div className="truncate text-xs text-muted-foreground">PHP {f.amount.toLocaleString()}{f.confirmed ? '' : ' · draft'}</div>
            </>
          )}
        />
      )}

      {tab === 'Documents' && (
        <RefDataManager
          collection={appDocs}
          addLabel="Add requirement"
          emptyText="No document requirements yet. Add the documents applicants must submit per franchise application type."
          defaults={{ name: '', appType: 'NEW_MTOP', sub: '', newUnit: false }}
          fields={[
            { key: 'name', label: 'Document', type: 'text', required: true, placeholder: 'Barangay Clearance' },
            { key: 'appType', label: 'Required for', type: 'select', options: [
              { value: 'NEW_MTOP', label: 'New MTOP' }, { value: 'RENEWAL', label: 'Renewal' },
              { value: 'CHANGE_MOTOR', label: 'Change of Motor' }, { value: 'DROPPING', label: 'Dropping' },
            ] },
            { key: 'sub', label: 'Note / where to get it', type: 'text', placeholder: "In applicant's name" },
            { key: 'newUnit', label: 'Label as "for a new unit"', type: 'checkbox' },
          ]}
          renderRow={(d) => (
            <>
              <div className="font-medium">{d.name} <span className="text-muted-foreground">({d.appType})</span></div>
              <div className="truncate text-xs text-muted-foreground">{d.sub}{d.newUnit ? ' · new unit' : ''}</div>
            </>
          )}
        />
      )}
    </>
  );
}
