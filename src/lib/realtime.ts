/**
 * Real-time updates for CrisisLens
 * WebSocket connections and live data streaming
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface RealtimeEvent {
  type: 'risk_update' | 'incident_report' | 'emergency_alert' | 'external_data' | 'notification'
  data: any
  timestamp: string
  regionId?: string
  userId?: string
}

export interface WebSocketConnection {
  id: string
  userId: string
  regionIds: string[]
  subscriptions: string[]
  lastActivity: Date
}

class RealtimeManager {
  private connections: Map<string, WebSocketConnection> = new Map()
  private eventQueue: RealtimeEvent[] = []
  private processingInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startEventProcessing();
    this.setupSupabaseSubscriptions();
  }

  // WebSocket connection management
  addConnection(userId: string, regionIds: string[] = [], subscriptions: string[] = []): string {
    const connectionId = `${userId}-${Date.now()}`;
    
    const connection: WebSocketConnection = {
      id: connectionId,
      userId,
      regionIds,
      subscriptions,
      lastActivity: new Date()
    };

    this.connections.set(connectionId, connection);
    console.log(`WebSocket connection added: ${connectionId} for user ${userId}`);
    
    return connectionId;
  }

  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      console.log(`WebSocket connection removed: ${connectionId}`);
    }
  }

  updateConnection(connectionId: string, updates: Partial<WebSocketConnection>): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      Object.assign(connection, updates, { lastActivity: new Date() });
    }
  }

  // Event broadcasting
  broadcastEvent(event: RealtimeEvent, targetConnections?: string[]): void {
    const connectionsToNotify = targetConnections 
      ? targetConnections.map(id => this.connections.get(id)).filter(Boolean)
      : this.getRelevantConnections(event);

    connectionsToNotify.forEach(connection => {
      if (connection && this.shouldNotifyConnection(connection, event)) {
        this.sendEventToConnection(connection.id, event);
      }
    });
  }

  private getRelevantConnections(event: RealtimeEvent): WebSocketConnection[] {
    return Array.from(this.connections.values()).filter(connection => {
      // Filter by region if specified
      if (event.regionId && !connection.regionIds.includes(event.regionId)) {
        return false;
      }

      // Filter by subscription type
      if (!connection.subscriptions.includes(event.type)) {
        return false;
      }

      return true;
    });
  }

  private shouldNotifyConnection(connection: WebSocketConnection, event: RealtimeEvent): boolean {
    // Check if connection is still active (last activity within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return connection.lastActivity > fiveMinutesAgo;
  }

  private sendEventToConnection(connectionId: string, event: RealtimeEvent): void {
    // In a real implementation, this would send through WebSocket
    // For now, we'll queue the event for the frontend to poll
    this.eventQueue.push({
      ...event,
      connectionId
    } as RealtimeEvent & { connectionId: string });

    console.log(`Event queued for connection ${connectionId}: ${event.type}`);
  }

  // Event queue processing
  private startEventProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processEventQueue();
    }, 1000); // Process every second
  }

  private processEventQueue(): void {
    if (this.eventQueue.length === 0) return;

    const events = this.eventQueue.splice(0, 10); // Process up to 10 events per cycle
    
    events.forEach(event => {
      // In a real implementation, this would send through WebSocket
      // For now, we'll store in a way that can be polled
      this.storeEventForPolling(event);
    });
  }

  private storeEventForPolling(event: RealtimeEvent & { connectionId?: string }): void {
    // Store event in a way that can be retrieved by polling
    // This could be Redis, database, or in-memory store
    const storageKey = event.connectionId 
      ? `events:${event.connectionId}` 
      : `events:${event.type}:${event.regionId || 'global'}`;
    
    // In production, use Redis or similar
    // For now, we'll use a simple in-memory approach
    console.log(`Stored event for polling: ${storageKey}`);
  }

  // Supabase real-time subscriptions
  private setupSupabaseSubscriptions(): void {
    // Subscribe to risk assessments
    supabase
      .channel('risk-assessments')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'risk_assessments' 
        },
        (payload) => {
          this.handleRiskAssessmentUpdate(payload.new);
        }
      )
      .subscribe();

    // Subscribe to incident reports
    supabase
      .channel('incident-reports')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'incident_reports' 
        },
        (payload) => {
          this.handleIncidentReport(payload.new);
        }
      )
      .subscribe();

    // Subscribe to notifications
    supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications' 
        },
        (payload) => {
          this.handleNotification(payload.new);
        }
      )
      .subscribe();
  }

  private handleRiskAssessmentUpdate(riskAssessment: any): void {
    const event: RealtimeEvent = {
      type: 'risk_update',
      data: {
        regionId: riskAssessment.region_id,
        overallRisk: riskAssessment.overall_risk,
        riskLevel: riskAssessment.risk_level,
        confidenceScore: riskAssessment.confidence_score,
        modelVersion: riskAssessment.model_version,
        timestamp: riskAssessment.created_at
      },
      timestamp: new Date().toISOString(),
      regionId: riskAssessment.region_id
    };

    this.broadcastEvent(event);
  }

  private handleIncidentReport(incident: any): void {
    const event: RealtimeEvent = {
      type: 'incident_report',
      data: {
        id: incident.id,
        regionId: incident.region_id,
        category: incident.category,
        severity: incident.severity,
        title: incident.title,
        description: incident.description,
        verified: incident.verified,
        createdAt: incident.created_at
      },
      timestamp: new Date().toISOString(),
      regionId: incident.region_id
    };

    this.broadcastEvent(event);
  }

  private handleNotification(notification: any): void {
    const event: RealtimeEvent = {
      type: 'notification',
      data: {
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        createdAt: notification.created_at
      },
      timestamp: new Date().toISOString(),
      userId: notification.user_id
    };

    // Send only to the specific user
    this.broadcastEvent(event, [notification.user_id]);
  }

  // Public API for external events
  broadcastEmergencyAlert(alert: any): void {
    const event: RealtimeEvent = {
      type: 'emergency_alert',
      data: {
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        category: alert.category,
        areas: alert.areas,
        issuedAt: alert.issuedAt,
        source: alert.source
      },
      timestamp: new Date().toISOString()
    };

    this.broadcastEvent(event);
  }

  broadcastExternalData(data: any, regionId?: string): void {
    const event: RealtimeEvent = {
      type: 'external_data',
      data: {
        weather: data.weather,
        alerts: data.alerts,
        news: data.news,
        socialPosts: data.socialPosts,
        analysis: data.analysis,
        collectedAt: data.collectedAt
      },
      timestamp: new Date().toISOString(),
      regionId
    };

    this.broadcastEvent(event);
  }

  // Connection health monitoring
  cleanupInactiveConnections(): void {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const inactiveConnections: string[] = [];

    this.connections.forEach((connection, id) => {
      if (connection.lastActivity < fiveMinutesAgo) {
        inactiveConnections.push(id);
      }
    });

    inactiveConnections.forEach(id => {
      this.removeConnection(id);
    });

    if (inactiveConnections.length > 0) {
      console.log(`Cleaned up ${inactiveConnections.length} inactive connections`);
    }
  }

  // Statistics and monitoring
  getConnectionStats(): any {
    const connections = Array.from(this.connections.values());
    
    return {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => 
        new Date(Date.now() - 5 * 60 * 1000) < c.lastActivity
      ).length,
      subscriptions: connections.reduce((acc, conn) => {
        conn.subscriptions.forEach(sub => {
          acc[sub] = (acc[sub] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>),
      regionsCovered: [...new Set(connections.flatMap(c => c.regionIds))].length,
      queueSize: this.eventQueue.length
    };
  }

  // Cleanup
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    this.connections.clear();
    this.eventQueue.length = 0;
    
    // Unsubscribe from Supabase channels
    supabase.removeAllChannels();
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();

// React hook for real-time updates (for frontend)
export function useRealtimeUpdates(
  userId: string,
  regionIds: string[] = [],
  subscriptions: string[] = ['risk_update', 'incident_report', 'emergency_alert']
) {
  // This would be a React hook in the frontend
  // For now, we'll provide the interface
  
  return {
    connect: () => realtimeManager.addConnection(userId, regionIds, subscriptions),
    disconnect: (connectionId: string) => realtimeManager.removeConnection(connectionId),
    updateSubscriptions: (connectionId: string, subscriptions: string[]) => 
      realtimeManager.updateConnection(connectionId, { subscriptions }),
    getEvents: () => {
      // Poll for events (in production, use WebSocket)
      return [];
    }
  };
}
