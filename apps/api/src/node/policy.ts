// Sync-class direction policy — what crosses a node boundary, and which way.
// Topology: cloud = Zambales provincial HUB, on-prem Santa Cruz LGU = SPOKE.
//   local_only   → NEVER crosses (applicant PII, payments, feedback stay on the LGU node).
//   cloud_only   → NEVER goes to a spoke (citizen accounts/OTP live on the hub).
//   up_projection/up_aggregate → spoke → hub only (issued MTOPs, enacted ordinances, statuses).
//   down         → hub → spoke only (province-wide config flows down).
//   (anything unset → treated as local_only: conservative, never leak.)
export type NodeRole = 'cloud' | 'onprem';

export function classFlows(syncClass: string | undefined, fromRole: NodeRole, toRole: NodeRole): boolean {
  switch (syncClass) {
    case 'up_projection':
    case 'up_aggregate':
      return fromRole === 'onprem' && toRole === 'cloud';
    case 'down':
      return fromRole === 'cloud' && toRole === 'onprem';
    case 'local_only':
    case 'cloud_only':
    default:
      return false;
  }
}
