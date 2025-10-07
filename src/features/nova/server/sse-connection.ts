/**
 * Server-Sent Events (SSE) Connection Manager
 *
 * Manages the lifecycle of an SSE connection including:
 * - Event sending with automatic flushing
 * - Keepalive pings
 * - Timeout management
 * - Graceful disconnection handling
 */

import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { SSEEventData, SSEEventType } from '../types/AgentStreamingTypes';

/**
 * Configuration options for SSE connections
 */
export interface SSEConnectionOptions {
  /** Timeout in milliseconds before auto-closing the connection */
  timeout?: number;
  /** Interval in milliseconds between keepalive pings */
  keepaliveInterval?: number;
  /** Callback when connection is established */
  onConnect?: (streamId: string) => void;
  /** Callback when connection is closed */
  onDisconnect?: (streamId: string, stats: SSEConnectionStats) => void;
}

/**
 * Statistics about an SSE connection
 */
export interface SSEConnectionStats {
  streamId: string;
  connected: boolean;
  ended: boolean;
  duration: number;
  eventCount: number;
}

/**
 * SSE Service interface for hooks
 */
export interface SSEService {
  send(event: SSEEventType, data: SSEEventData): void;
  sendError(message: string, code?: string): void;
  ping(): void;
  isConnected(): boolean;
  streamId: string;
}

/**
 * Manages a Server-Sent Events connection
 */
export class SSEConnection implements SSEService {
  public readonly streamId: string;

  private connected = false;
  private ended = true;
  private eventCount = 0;
  private startTime = Date.now();

  private keepaliveInterval?: NodeJS.Timeout;
  private timeoutTimer?: NodeJS.Timeout;

  constructor(
    private readonly encoder: TextEncoder,
    private readonly controller: ReadableStreamDefaultController<Uint8Array>,
    streamId?: string,
    private readonly options: SSEConnectionOptions = {}
  ) {
    this.streamId = streamId || uuidv4();
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Initialize the SSE connection
   */
  initialize(): void {
    if (this.connected) return;

    this.connected = true;
    this.ended = false;

    this.setupKeepalive();
    this.setupTimeout();

    // Call connection callback
    this.options.onConnect?.(this.streamId);

    console.log(`[SSE] Connection initialized: ${this.streamId}`);
  }

  /**
   * Send an SSE event to the client
   */
  send(event: SSEEventType, data: SSEEventData): void {
    if (!this.isConnected()) {
      console.debug(
        `[SSE] Skipping ${event} event - stream ${this.streamId} disconnected`
      );
      return;
    }

    try {
      // Format and send SSE event
      const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      this.controller.enqueue(this.encoder.encode(eventData));

      this.eventCount++;
    } catch (error) {
      console.error(
        `[SSE] Failed to send SSE event for stream ${this.streamId}:`,
        error
      );
      this.markDisconnected();
    }
  }

  /**
   * Send an error event to the client
   */
  sendError(message: string, code: string = 'ERROR'): void {
    this.send('error', {
      message,
      code,
      streamId: this.streamId,
    });
  }

  /**
   * Send a keepalive ping
   */
  ping(): void {
    if (!this.isConnected()) return;

    try {
      this.controller.enqueue(this.encoder.encode(':ping\n\n'));
    } catch {
      // Connection likely closed
      this.markDisconnected();
    }
  }

  /**
   * Check if the connection is active
   */
  isConnected(): boolean {
    return this.connected && !this.ended;
  }

  /**
   * Check if the connection has ended
   */
  isEnded(): boolean {
    return this.ended;
  }

  /**
   * Mark the connection as disconnected
   */
  markDisconnected(): void {
    if (!this.connected) return;

    this.connected = false;
    this.cleanup();

    console.log(`[SSE] Connection disconnected: ${this.streamId}`);
  }

  /**
   * End the SSE connection gracefully
   */
  async end(): Promise<void> {
    if (this.ended) return;

    // Mark as ended and cleanup
    this.ended = true;
    this.cleanup();

    // Close the controller
    try {
      this.controller.close();
    } catch {
      // Controller may already be closed
      console.debug(`[SSE] Controller already closed for stream ${this.streamId}`);
    }

    // Call disconnection callback
    this.options.onDisconnect?.(this.streamId, this.getStats());

    console.log(
      `[SSE] Connection ended: ${this.streamId}`,
      this.getStats()
    );
  }

  /**
   * Get connection statistics
   */
  getStats(): SSEConnectionStats {
    return {
      streamId: this.streamId,
      connected: this.connected,
      ended: this.ended,
      duration: Date.now() - this.startTime,
      eventCount: this.eventCount,
    };
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Set up keepalive ping interval
   */
  private setupKeepalive(): void {
    const interval = this.options.keepaliveInterval || 30000;

    this.keepaliveInterval = setInterval(() => {
      if (this.isConnected()) {
        this.ping();
      } else {
        this.cleanup();
      }
    }, interval);
  }

  /**
   * Set up connection timeout
   */
  private setupTimeout(): void {
    if (!this.options.timeout) return;

    this.timeoutTimer = setTimeout(() => {
      if (!this.ended) {
        console.warn(
          `[SSE] Connection timeout for stream ${this.streamId} after ${this.options.timeout}ms`
        );
        this.sendError('Stream timeout exceeded', 'TIMEOUT');
        this.end();
      }
    }, this.options.timeout);
  }

  /**
   * Clean up timers and resources
   */
  private cleanup(): void {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = undefined;
    }

    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = undefined;
    }
  }
}

/**
 * Set up SSE on a response object
 * For Next.js 15 App Router with streaming responses
 */
export function setupSSE(
  req: NextRequest,
  options: SSEConnectionOptions = {}
): { stream: ReadableStream; sse: SSEConnection } {
  const encoder = new TextEncoder();

  let sseConnection: SSEConnection;

  const stream = new ReadableStream({
    start(controller) {
      // Create SSE connection with the controller
      sseConnection = new SSEConnection(encoder, controller, undefined, options);

      // Initialize connection
      sseConnection.initialize();

      // Handle client disconnection
      req.signal.addEventListener('abort', () => {
        sseConnection.markDisconnected();
        controller.close();
      });
    },
  });

  return { stream, sse: sseConnection! };
}
