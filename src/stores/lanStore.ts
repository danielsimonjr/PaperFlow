/**
 * LAN Store (Sprint 22)
 *
 * Zustand store for managing LAN collaboration state, peer connections,
 * and real-time sync.
 */

import { create } from 'zustand';
import {
  getServiceDiscovery,
  destroyServiceDiscovery,
  type DiscoveredPeer,
} from '@lib/lan/serviceDiscovery';

/**
 * Connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Connected peer with connection info
 */
export interface ConnectedPeer extends DiscoveredPeer {
  connectionStatus: ConnectionStatus;
  connectionError?: string;
  latency?: number;
  connectedAt?: number;
}

/**
 * Shared workspace info
 */
export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  documents: string[];
  members: string[];
  createdAt: number;
}

/**
 * Collaborator presence info
 */
export interface CollaboratorPresence {
  peerId: string;
  peerName: string;
  documentId?: string;
  pageNumber?: number;
  cursorPosition?: { x: number; y: number };
  selection?: { start: number; end: number };
  isActive: boolean;
  lastActivity: number;
}

/**
 * LAN store state
 */
interface LANState {
  // Discovery state
  isDiscoveryEnabled: boolean;
  isDiscoveryRunning: boolean;
  discoveredPeers: DiscoveredPeer[];

  // Connection state
  connectedPeers: ConnectedPeer[];
  trustedPeers: string[];

  // Workspace state
  activeWorkspace: Workspace | null;
  availableWorkspaces: Workspace[];

  // Presence state
  collaborators: CollaboratorPresence[];

  // Sync state
  isSyncing: boolean;
  syncError: string | null;
  lastSyncTime: number | null;

  // Settings
  autoConnect: boolean;
  requireAuthentication: boolean;
}

/**
 * LAN store actions
 */
interface LANActions {
  // Discovery actions
  startDiscovery: () => Promise<void>;
  stopDiscovery: () => Promise<void>;
  refreshPeers: () => void;

  // Connection actions
  connectToPeer: (peerId: string) => Promise<void>;
  disconnectFromPeer: (peerId: string) => Promise<void>;
  disconnectAll: () => Promise<void>;
  trustPeer: (peerId: string) => void;
  untrustPeer: (peerId: string) => void;

  // Workspace actions
  createWorkspace: (name: string) => Promise<Workspace>;
  joinWorkspace: (workspaceId: string) => Promise<void>;
  leaveWorkspace: () => Promise<void>;
  addDocumentToWorkspace: (documentId: string) => void;
  removeDocumentFromWorkspace: (documentId: string) => void;

  // Presence actions
  updatePresence: (presence: Partial<CollaboratorPresence>) => void;
  setActiveDocument: (documentId: string, pageNumber: number) => void;
  setCursorPosition: (x: number, y: number) => void;

  // Sync actions
  syncDocument: (documentId: string) => Promise<void>;
  pauseSync: () => void;
  resumeSync: () => void;

  // Settings actions
  setAutoConnect: (enabled: boolean) => void;
  setRequireAuthentication: (required: boolean) => void;

  // Internal actions
  _handlePeerDiscovered: (peer: DiscoveredPeer) => void;
  _handlePeerUpdated: (peer: DiscoveredPeer) => void;
  _handlePeerLost: (peerId: string) => void;
}

/**
 * Complete LAN store type
 */
type LANStoreState = LANState & LANActions;

/**
 * Initial state
 */
const initialState: LANState = {
  isDiscoveryEnabled: true,
  isDiscoveryRunning: false,
  discoveredPeers: [],
  connectedPeers: [],
  trustedPeers: [],
  activeWorkspace: null,
  availableWorkspaces: [],
  collaborators: [],
  isSyncing: false,
  syncError: null,
  lastSyncTime: null,
  autoConnect: false,
  requireAuthentication: true,
};

/**
 * LAN collaboration store
 */
export const useLANStore = create<LANStoreState>((set, get) => ({
  ...initialState,

  /**
   * Start peer discovery
   */
  startDiscovery: async () => {
    const discovery = getServiceDiscovery();

    discovery.setEventHandlers({
      onPeerDiscovered: get()._handlePeerDiscovered,
      onPeerUpdated: get()._handlePeerUpdated,
      onPeerLost: get()._handlePeerLost,
      onError: (error) => {
        console.error('[LAN] Discovery error:', error);
      },
    });

    await discovery.start();
    set({ isDiscoveryRunning: true });
  },

  /**
   * Stop peer discovery
   */
  stopDiscovery: async () => {
    await destroyServiceDiscovery();
    set({
      isDiscoveryRunning: false,
      discoveredPeers: [],
    });
  },

  /**
   * Refresh peer list
   */
  refreshPeers: () => {
    const discovery = getServiceDiscovery();
    const peers = discovery.getPeers();
    set({ discoveredPeers: peers });
  },

  /**
   * Connect to a peer
   */
  connectToPeer: async (peerId: string) => {
    const { discoveredPeers, connectedPeers, trustedPeers, requireAuthentication } = get();

    // Find the peer
    const peer = discoveredPeers.find((p) => p.id === peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }

    // Check if already connected
    if (connectedPeers.some((p) => p.id === peerId)) {
      return;
    }

    // Check trust if authentication required
    if (requireAuthentication && !trustedPeers.includes(peerId)) {
      // In a real implementation, this would trigger trust verification
      console.warn('[LAN] Peer not trusted, connection may fail');
    }

    // Add to connected peers with connecting status
    const connectedPeer: ConnectedPeer = {
      ...peer,
      connectionStatus: 'connecting',
    };

    set({
      connectedPeers: [...connectedPeers, connectedPeer],
    });

    try {
      // In a real implementation, this would:
      // 1. Establish secure TLS connection
      // 2. Perform mutual authentication
      // 3. Exchange capabilities

      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update connection status
      set({
        connectedPeers: connectedPeers.map((p) =>
          p.id === peerId
            ? {
                ...p,
                connectionStatus: 'connected' as const,
                connectedAt: Date.now(),
              }
            : p
        ),
      });
    } catch (error) {
      set({
        connectedPeers: connectedPeers.map((p) =>
          p.id === peerId
            ? {
                ...p,
                connectionStatus: 'error' as const,
                connectionError: error instanceof Error ? error.message : 'Connection failed',
              }
            : p
        ),
      });
    }
  },

  /**
   * Disconnect from a peer
   */
  disconnectFromPeer: async (peerId: string) => {
    const { connectedPeers, collaborators } = get();

    // Remove from connected peers
    set({
      connectedPeers: connectedPeers.filter((p) => p.id !== peerId),
      collaborators: collaborators.filter((c) => c.peerId !== peerId),
    });
  },

  /**
   * Disconnect from all peers
   */
  disconnectAll: async () => {
    set({
      connectedPeers: [],
      collaborators: [],
      activeWorkspace: null,
    });
  },

  /**
   * Trust a peer
   */
  trustPeer: (peerId: string) => {
    const { trustedPeers } = get();
    if (!trustedPeers.includes(peerId)) {
      set({ trustedPeers: [...trustedPeers, peerId] });
    }
  },

  /**
   * Untrust a peer
   */
  untrustPeer: (peerId: string) => {
    const { trustedPeers } = get();
    set({ trustedPeers: trustedPeers.filter((id) => id !== peerId) });
  },

  /**
   * Create a new workspace
   */
  createWorkspace: async (name: string) => {
    const discovery = getServiceDiscovery();
    const localPeer = discovery.getLocalPeerInfo();

    const workspace: Workspace = {
      id: `ws-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name,
      ownerId: localPeer.id,
      ownerName: localPeer.name,
      documents: [],
      members: [localPeer.id],
      createdAt: Date.now(),
    };

    const { availableWorkspaces } = get();
    set({
      activeWorkspace: workspace,
      availableWorkspaces: [...availableWorkspaces, workspace],
    });

    return workspace;
  },

  /**
   * Join an existing workspace
   */
  joinWorkspace: async (workspaceId: string) => {
    const { availableWorkspaces } = get();
    const workspace = availableWorkspaces.find((w) => w.id === workspaceId);

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const discovery = getServiceDiscovery();
    const localPeer = discovery.getLocalPeerInfo();

    // Add ourselves to members
    const updatedWorkspace: Workspace = {
      ...workspace,
      members: [...workspace.members, localPeer.id],
    };

    set({
      activeWorkspace: updatedWorkspace,
      availableWorkspaces: availableWorkspaces.map((w) =>
        w.id === workspaceId ? updatedWorkspace : w
      ),
    });
  },

  /**
   * Leave the active workspace
   */
  leaveWorkspace: async () => {
    const { activeWorkspace, availableWorkspaces } = get();

    if (!activeWorkspace) {
      return;
    }

    const discovery = getServiceDiscovery();
    const localPeer = discovery.getLocalPeerInfo();

    // Remove ourselves from members
    const updatedWorkspace: Workspace = {
      ...activeWorkspace,
      members: activeWorkspace.members.filter((id) => id !== localPeer.id),
    };

    set({
      activeWorkspace: null,
      availableWorkspaces: availableWorkspaces.map((w) =>
        w.id === activeWorkspace.id ? updatedWorkspace : w
      ),
      collaborators: [],
    });
  },

  /**
   * Add document to workspace
   */
  addDocumentToWorkspace: (documentId: string) => {
    const { activeWorkspace } = get();

    if (!activeWorkspace) {
      return;
    }

    if (!activeWorkspace.documents.includes(documentId)) {
      set({
        activeWorkspace: {
          ...activeWorkspace,
          documents: [...activeWorkspace.documents, documentId],
        },
      });
    }
  },

  /**
   * Remove document from workspace
   */
  removeDocumentFromWorkspace: (documentId: string) => {
    const { activeWorkspace } = get();

    if (!activeWorkspace) {
      return;
    }

    set({
      activeWorkspace: {
        ...activeWorkspace,
        documents: activeWorkspace.documents.filter((id) => id !== documentId),
      },
    });
  },

  /**
   * Update local presence
   */
  updatePresence: (presence: Partial<CollaboratorPresence>) => {
    // In a real implementation, this would broadcast to connected peers
    console.debug('[LAN] Updating presence:', presence);
  },

  /**
   * Set active document and page
   */
  setActiveDocument: (documentId: string, pageNumber: number) => {
    get().updatePresence({ documentId, pageNumber, isActive: true, lastActivity: Date.now() });
  },

  /**
   * Set cursor position
   */
  setCursorPosition: (x: number, y: number) => {
    get().updatePresence({ cursorPosition: { x, y }, lastActivity: Date.now() });
  },

  /**
   * Sync a document with peers
   * Note: documentId reserved for future per-document sync implementation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  syncDocument: async (_documentId: string) => {
    set({ isSyncing: true, syncError: null });

    try {
      // In a real implementation, this would:
      // 1. Get local changes
      // 2. Send to connected peers
      // 3. Receive remote changes
      // 4. Merge using CRDT

      await new Promise((resolve) => setTimeout(resolve, 500));

      set({
        isSyncing: false,
        lastSyncTime: Date.now(),
      });
    } catch (error) {
      set({
        isSyncing: false,
        syncError: error instanceof Error ? error.message : 'Sync failed',
      });
    }
  },

  /**
   * Pause sync
   */
  pauseSync: () => {
    // Would pause CRDT sync
    set({ isSyncing: false });
  },

  /**
   * Resume sync
   */
  resumeSync: () => {
    // Would resume CRDT sync
    set({ isSyncing: true });
  },

  /**
   * Set auto-connect preference
   */
  setAutoConnect: (enabled: boolean) => {
    set({ autoConnect: enabled });
  },

  /**
   * Set authentication requirement
   */
  setRequireAuthentication: (required: boolean) => {
    set({ requireAuthentication: required });
  },

  /**
   * Handle peer discovered event
   */
  _handlePeerDiscovered: (peer: DiscoveredPeer) => {
    const { discoveredPeers, autoConnect, trustedPeers, connectToPeer } = get();

    // Add to discovered peers
    set({
      discoveredPeers: [...discoveredPeers.filter((p) => p.id !== peer.id), peer],
    });

    // Auto-connect if enabled and trusted
    if (autoConnect && trustedPeers.includes(peer.id)) {
      connectToPeer(peer.id);
    }
  },

  /**
   * Handle peer updated event
   */
  _handlePeerUpdated: (peer: DiscoveredPeer) => {
    const { discoveredPeers, connectedPeers } = get();

    // Update in discovered peers
    set({
      discoveredPeers: discoveredPeers.map((p) => (p.id === peer.id ? peer : p)),
      connectedPeers: connectedPeers.map((p) =>
        p.id === peer.id ? { ...p, ...peer } : p
      ),
    });
  },

  /**
   * Handle peer lost event
   */
  _handlePeerLost: (peerId: string) => {
    const { discoveredPeers, connectedPeers, collaborators } = get();

    set({
      discoveredPeers: discoveredPeers.filter((p) => p.id !== peerId),
      connectedPeers: connectedPeers.filter((p) => p.id !== peerId),
      collaborators: collaborators.filter((c) => c.peerId !== peerId),
    });
  },
}));

/**
 * Hook for discovery status
 */
export function useDiscoveryStatus() {
  const isRunning = useLANStore((s) => s.isDiscoveryRunning);
  const peerCount = useLANStore((s) => s.discoveredPeers.length);
  return { isRunning, peerCount };
}

/**
 * Hook for connection status
 */
export function useConnectionStatus() {
  const connectedCount = useLANStore((s) => s.connectedPeers.filter((p) => p.connectionStatus === 'connected').length);
  const isSyncing = useLANStore((s) => s.isSyncing);
  return { connectedCount, isSyncing };
}

export default useLANStore;
