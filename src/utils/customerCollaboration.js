const STORAGE_KEY = 'cng-portal-customer-collab-v1';
const CHANNEL_NAME = 'cng-portal-customer-collab';

export const CUSTOMER_STATUS_OPTIONS = [
  'Monitoring',
  'Action required',
  'Maintenance planned',
  'Billing review',
  'Resolved',
  'Awaiting customer response',
];

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function defaultThread(customerKey, seed = {}) {
  const now = new Date().toISOString();
  return {
    customerKey,
    status: seed.status || 'Monitoring',
    updatedAt: now,
    messages: seed.messages || [],
  };
}

function readState() {
  if (typeof window === 'undefined') return { threads: {} };
  return safeParse(window.localStorage.getItem(STORAGE_KEY)) || { threads: {} };
}

function writeState(state) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('cng-customer-collab-change', { detail: { storageKey: STORAGE_KEY } }));
  if (window.BroadcastChannel) {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'sync' });
    channel.close();
  }
}

export function ensureCustomerThread(customerKey, seed = {}) {
  const state = readState();
  if (!state.threads[customerKey]) {
    state.threads[customerKey] = defaultThread(customerKey, seed);
    writeState(state);
  }
  return state.threads[customerKey];
}

export function getCustomerThread(customerKey) {
  const state = readState();
  return state.threads[customerKey] || defaultThread(customerKey);
}

export function upsertCustomerThread(customerKey, updater) {
  const state = readState();
  const current = state.threads[customerKey] || defaultThread(customerKey);
  const next = updater ? updater(current) : current;
  state.threads[customerKey] = {
    ...current,
    ...next,
    customerKey,
  };
  writeState(state);
  return state.threads[customerKey];
}

export function appendCustomerUpdate(customerKey, entry) {
  return upsertCustomerThread(customerKey, (current) => {
    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      kind: entry.kind || 'comment',
      authorRole: entry.authorRole || 'Operator',
      authorName: entry.authorName || 'Marketing Operator',
      status: entry.status || current.status,
      text: entry.text || '',
    };

    return {
      status: entry.status || current.status,
      updatedAt: message.createdAt,
      messages: [...current.messages, message],
    };
  });
}

export function subscribeCustomerCollaboration(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };

  const handleCustom = () => callback();

  let channel = null;
  if (window.BroadcastChannel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = () => callback();
  }

  window.addEventListener('storage', handleStorage);
  window.addEventListener('cng-customer-collab-change', handleCustom);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('cng-customer-collab-change', handleCustom);
    if (channel) channel.close();
  };
}

export function formatThreadTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
