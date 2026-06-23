// The data-layer seam — backed by @gelabs/sp/sync-client (IndexedDB + outbox + background
// sync to the platform API). Collections present in the @gelabs/sp/contracts registry
// sync to the server; the rest run device-local.
export {
  createCollection,
  uid,
  uuidv7,
  todayISO,
  makeRef,
  getNextRef,
  setActor,
  clearActor,
  loginStaff,
  logoutStaff,
  restoreSession,
  useSyncStatus,
  type Collection,
  type Identified,
} from '@gelabs/sp/sync-client';
