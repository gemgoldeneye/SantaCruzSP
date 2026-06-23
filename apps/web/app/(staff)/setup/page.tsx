'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { RefDataManager } from '@/components/setup/ref-data-manager';
import { CommitteesManager } from '@/components/setup/committees-manager';
import { members, zones, todas, fees } from '@/data';
import { cn } from '@/lib/utils';

const TABS = ['Roster', 'Committees', 'Zones', 'TODAs', 'Fees'] as const;
type Tab = (typeof TABS)[number];

export default function SetupPage() {
  const [tab, setTab] = useState<Tab>('Roster');

  return (
    <>
      <PageHeader
        title="Setup"
        description="Set up your Sangguniang Bayan roster, committees, and tricycle-franchising reference data. Everything here is created and maintained by your office."
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

      {tab === 'Roster' && (
        <RefDataManager
          collection={members}
          addLabel="Add member"
          emptyText="No SB members yet. Add your Sangguniang Bayan roster."
          defaults={{ name: '', district: '', role: 'Member' }}
          fields={[
            { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Hon. Juan dela Cruz' },
            { key: 'district', label: 'District / designation', type: 'text', placeholder: 'District 1 / At-large' },
            { key: 'role', label: 'Role', type: 'select', required: true, options: [
              { value: 'Presiding Officer', label: 'Presiding Officer' },
              { value: 'Member', label: 'Member' },
            ] },
          ]}
          renderRow={(m) => (
            <>
              <div className="font-medium">{m.name}</div>
              <div className="truncate text-xs text-muted-foreground">{m.role}{m.district ? ` · ${m.district}` : ''}</div>
            </>
          )}
        />
      )}

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
    </>
  );
}
