/**
 * Service Discovery Module (Sprint 22)
 *
 * Implements mDNS/Bonjour service discovery for finding
 * other PaperFlow instances on the local network.
 */

/**
 * Discovered peer information
 */
export interface DiscoveredPeer {
  /** Unique peer ID */
  id: string;
  /** Display name */
  name: string;
  /** IP address */
  address: string;
  /** Port number */
  port: number;
  /** PaperFlow version */
  version: string;
  /** Peer capabilities */
  capabilities: PeerCapability[];
  /** When the peer was discovered */
  discoveredAt: number;
  /** Last seen timestamp */
  lastSeen: number;
  /** Peer status */
  status: 'online' | 'offline' | 'busy';
}

/**
 * Peer capability flags
 */
export type PeerCapability =
  | 'sync'
  | 'share'
  | 'annotate'
  | 'chat'
  | 'cursor'
  | 'presence';

/**
 * Service discovery options
 */
export interface DiscoveryOptions {
  /** Service name (default: _paperflow._tcp) */
  serviceName?: string;
  /** Discovery port (default: 5353) */
  port?: number;
  /** Broadcast interval in ms (default: 5000) */
  broadcastInterval?: number;
  /** Peer timeout in ms (default: 30000) */
  peerTimeout?: number;
}

/**
 * Service discovery events
 */
export interface DiscoveryEvents {
  onPeerDiscovered: (peer: DiscoveredPeer) => void;
  onPeerUpdated: (peer: DiscoveredPeer) => void;
  onPeerLost: (peerId: string) => void;
  onError: (error: Error) => void;
}

/**
 * Default discovery options
 */
const DEFAULT_OPTIONS: Required<DiscoveryOptions> = {
  serviceName: '_paperflow._tcp',
  port: 5353,
  broadcastInterval: 5000,
  peerTimeout: 30000,
};

/**
 * Service Discovery class
 */
class ServiceDiscovery {
  private options: Required<DiscoveryOptions>;
  private peers: Map<string, DiscoveredPeer> = new Map();
  private events: Partial<DiscoveryEvents> = {};
  private isRunning = false;
  private broadcastTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private localPeerId: string;
  private localPeerName: string;

  constructor(options: DiscoveryOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.localPeerId = this.generatePeerId();
    this.localPeerName = this.generatePeerName();
  }

  /**
   * Generate a unique peer ID
   */
  private generatePeerId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `peer-${timestamp}-${random}`;
  }

  /**
   * Generate a display name for this peer
   */
  private generatePeerName(): string {
    // Try to get machine name
    if (typeof window !== 'undefined' && window.electron) {
      // In Electron, we could get the hostname
      return `PaperFlow-${this.localPeerId.slice(-6)}`;
    }
    return `PaperFlow-${this.localPeerId.slice(-6)}`;
  }

  /**
   * Set event handlers
   */
  setEventHandlers(events: Partial<DiscoveryEvents>): void {
    this.events = events;
  }

  /**
   * Start service discovery
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // In a real implementation, this would:
    // 1. Start mDNS/Bonjour service
    // 2. Publish our service
    // 3. Browse for other services

    // Start broadcast timer
    this.broadcastTimer = setInterval(() => {
      this.broadcast();
    }, this.options.broadcastInterval);

    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupStalePeers();
    }, this.options.peerTimeout / 2);

    // Initial broadcast
    this.broadcast();
  }

  /**
   * Stop service discovery
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.broadcastTimer) {
      clearInterval(this.broadcastTimer);
      this.broadcastTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    // Clear peers
    this.peers.clear();
  }

  /**
   * Broadcast our presence
   */
  private broadcast(): void {
    // In a real implementation, this would send mDNS announcements
    // For simulation, we'll just log
    console.debug('[ServiceDiscovery] Broadcasting presence', {
      id: this.localPeerId,
      name: this.localPeerName,
    });
  }

  /**
   * Handle discovered peer
   */
  handlePeerDiscovered(peerData: Omit<DiscoveredPeer, 'discoveredAt' | 'lastSeen'>): void {
    // Ignore ourselves
    if (peerData.id === this.localPeerId) {
      return;
    }

    const now = Date.now();
    const existingPeer = this.peers.get(peerData.id);

    if (existingPeer) {
      // Update existing peer
      const updatedPeer: DiscoveredPeer = {
        ...existingPeer,
        ...peerData,
        lastSeen: now,
      };
      this.peers.set(peerData.id, updatedPeer);
      this.events.onPeerUpdated?.(updatedPeer);
    } else {
      // New peer
      const newPeer: DiscoveredPeer = {
        ...peerData,
        discoveredAt: now,
        lastSeen: now,
      };
      this.peers.set(peerData.id, newPeer);
      this.events.onPeerDiscovered?.(newPeer);
    }
  }

  /**
   * Clean up stale peers
   */
  private cleanupStalePeers(): void {
    const now = Date.now();
    const staleThreshold = now - this.options.peerTimeout;

    for (const [peerId, peer] of this.peers) {
      if (peer.lastSeen < staleThreshold) {
        this.peers.delete(peerId);
        this.events.onPeerLost?.(peerId);
      }
    }
  }

  /**
   * Get all discovered peers
   */
  getPeers(): DiscoveredPeer[] {
    return Array.from(this.peers.values());
  }

  /**
   * Get a specific peer by ID
   */
  getPeer(peerId: string): DiscoveredPeer | undefined {
    return this.peers.get(peerId);
  }

  /**
   * Get online peers only
   */
  getOnlinePeers(): DiscoveredPeer[] {
    return this.getPeers().filter((p) => p.status === 'online');
  }

  /**
   * Get local peer info
   */
  getLocalPeerInfo(): Omit<DiscoveredPeer, 'discoveredAt' | 'lastSeen'> {
    return {
      id: this.localPeerId,
      name: this.localPeerName,
      address: '127.0.0.1', // Would be actual IP
      port: this.options.port,
      version: '4.5.0',
      capabilities: ['sync', 'share', 'annotate', 'presence', 'cursor'],
      status: 'online',
    };
  }

  /**
   * Check if discovery is running
   */
  isDiscoveryRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Manually add a peer (for manual IP entry)
   */
  addManualPeer(address: string, port: number): void {
    const peerId = `manual-${address}-${port}`;

    this.handlePeerDiscovered({
      id: peerId,
      name: `Manual Peer (${address})`,
      address,
      port,
      version: 'unknown',
      capabilities: ['sync', 'share'],
      status: 'offline', // Will be updated on successful connection
    });
  }

  /**
   * Remove a peer
   */
  removePeer(peerId: string): void {
    if (this.peers.has(peerId)) {
      this.peers.delete(peerId);
      this.events.onPeerLost?.(peerId);
    }
  }
}

// Singleton instance
let discoveryInstance: ServiceDiscovery | null = null;

/**
 * Get the service discovery instance
 */
export function getServiceDiscovery(options?: DiscoveryOptions): ServiceDiscovery {
  if (!discoveryInstance) {
    discoveryInstance = new ServiceDiscovery(options);
  }
  return discoveryInstance;
}

/**
 * Destroy the service discovery instance
 */
export async function destroyServiceDiscovery(): Promise<void> {
  if (discoveryInstance) {
    await discoveryInstance.stop();
    discoveryInstance = null;
  }
}

export default ServiceDiscovery;
