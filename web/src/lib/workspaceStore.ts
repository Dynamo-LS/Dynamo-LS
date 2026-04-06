import type { AppState, LoginProfile } from "../types";

const DB_NAME = "dynamic-learning-scheduler";
const DB_VERSION = 1;
const STORE_NAME = "workspace";
const ACTIVE_USER_KEY = "active-user-name";
const LEGACY_WORKSPACE_KEY = "active-workspace";
const USER_WORKSPACE_PREFIX = "user-workspace::";

export interface PersistedWorkspace {
  profile: LoginProfile | null;
  appState: AppState;
  currentPage: string;
  introSeen: boolean;
}

export function normalizeUserName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function userWorkspaceKey(name: string): string {
  return `${USER_WORKSPACE_PREFIX}${normalizeUserName(name)}`;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  if (!window.indexedDB) {
    throw new Error("IndexedDB is not supported in this browser");
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

export async function getWorkspace(): Promise<PersistedWorkspace | null> {
  const activeUser = await getActiveUserName();
  if (!activeUser) {
    return null;
  }
  return getWorkspaceByName(activeUser);
}

export async function getWorkspaceByName(name: string): Promise<PersistedWorkspace | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(userWorkspaceKey(name));
    const result = await requestToPromise<PersistedWorkspace | undefined>(request);
    return result ?? null;
  } finally {
    database.close();
  }
}

export async function saveWorkspace(workspace: PersistedWorkspace): Promise<void> {
  if (!workspace.profile?.name) {
    throw new Error("Cannot save workspace without profile name");
  }
  await saveWorkspaceForName(workspace.profile.name, workspace);
}

export async function saveWorkspaceForName(name: string, workspace: PersistedWorkspace): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(workspace, userWorkspaceKey(name));
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save workspace"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Failed to save workspace"));
    });
  } finally {
    database.close();
  }
}

export async function clearWorkspace(): Promise<void> {
  await clearActiveUserName();
}

export async function getActiveUserName(): Promise<string | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(ACTIVE_USER_KEY);
    const value = await requestToPromise<string | undefined>(request);
    return value ?? null;
  } finally {
    database.close();
  }
}

export async function setActiveUserName(name: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(name, ACTIVE_USER_KEY);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Failed to set active user"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Failed to set active user"));
    });
  } finally {
    database.close();
  }
}

export async function clearActiveUserName(): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(ACTIVE_USER_KEY);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Failed to clear workspace"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Failed to clear workspace"));
    });
  } finally {
    database.close();
  }
}

export async function getLegacyWorkspace(): Promise<PersistedWorkspace | null> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(LEGACY_WORKSPACE_KEY);
    const result = await requestToPromise<PersistedWorkspace | undefined>(request);
    return result ?? null;
  } finally {
    database.close();
  }
}

export async function clearLegacyWorkspace(): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(LEGACY_WORKSPACE_KEY);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Failed to clear legacy workspace"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Failed to clear legacy workspace"));
    });
  } finally {
    database.close();
  }
}