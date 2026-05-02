/**
 * Simplified database integration for CrisisLens
 * Works with current setup without complex typing
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Region operations
export async function getRegions() {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export async function getRegionById(id: string) {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

// Incident report operations
export async function getIncidentReports(options?: {
  regionId?: string
  category?: string
  severity?: number
  status?: string
  limit?: number
}) {
  let query = supabase
    .from('incident_reports')
    .select(`
      *,
      regions(name, code, center_lat, center_lng)
    `)
    .order('created_at', { ascending: false })
  
  if (options?.regionId) {
    query = query.eq('region_id', options.regionId)
  }
  if (options?.category) {
    query = query.eq('category', options.category)
  }
  if (options?.severity) {
    query = query.eq('severity', options.severity)
  }
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createIncidentReport(report: {
  regionId: string
  category: string
  severity: number
  title: string
  description: string
  latitude?: number
  longitude?: number
  locationAddress?: string
  country?: string
  state?: string
  city?: string
  images?: string[]
  sources?: Record<string, any>
  embedding?: number[]
}) {
  const payload: any = {
    region_id: report.regionId,
    category: report.category,
    severity: report.severity,
    title: report.title,
    description: report.description,
    latitude: report.latitude,
    longitude: report.longitude,
    location_address: report.locationAddress,
    images: report.images,
    sources: {
      ...report.sources,
      country: report.country || 'India',
      state: report.state,
      city: report.city
    }
  }

  // Only attach embedding if it exists to avoid Supabase schema cache crash if pgvector isn't set up yet
  if (report.embedding) {
    payload.embedding = report.embedding;
  }

  const { data, error } = await supabase
    .from('incident_reports')
    .insert(payload)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// RAG: Similarity search
export async function findSimilarIncidents(embedding: number[], threshold = 0.5, count = 5) {
  const { data, error } = await supabase.rpc('match_incidents', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: count
  })

  if (error) throw error
  return data
}

// Risk assessment operations
export async function getRiskAssessments(regionId?: string) {
  let query = supabase
    .from('risk_assessments')
    .select(`
      *,
      regions(name, code)
    `)
    .order('created_at', { ascending: false })
  
  if (regionId) {
    query = query.eq('region_id', regionId)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createRiskAssessment(assessment: {
  regionId: string
  overallRisk: number
  confidenceScore: number
  riskLevel: string
  modelVersion: string
  dynamicFactors?: Record<string, number>
  features: Record<string, any>
  featureImportance: Record<string, any>
}) {
  const { data, error } = await supabase
    .from('risk_assessments')
    .insert({
      region_id: assessment.regionId,
      overall_risk: assessment.overallRisk,
      confidence_score: assessment.confidenceScore,
      risk_level: assessment.riskLevel,
      model_version: assessment.modelVersion,
      dynamic_factors: assessment.dynamicFactors || {},
      features: assessment.features,
      feature_importance: assessment.featureImportance,
      valid_until: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    })
    .select()
    .single()
  
  
  if (error) throw error
  return data
}

// External data feed operations
export async function getExternalDataFeeds(options?: {
  source?: string
  dataType?: string
  regionId?: string
}) {
  let query = supabase
    .from('external_data_feeds')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (options?.source) {
    query = query.eq('source', options.source)
  }
  if (options?.dataType) {
    query = query.eq('data_type', options.dataType)
  }
  if (options?.regionId) {
    query = query.eq('region_id', options.regionId)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createExternalDataFeed(feed: {
  source: string
  dataType: string
  regionId?: string
  rawData: Record<string, any>
  processedData?: Record<string, any>
  confidenceScore?: number
  relevanceScore?: number
}) {
  const { data, error } = await supabase
    .from('external_data_feeds')
    .insert({
      source: feed.source,
      data_type: feed.dataType,
      region_id: feed.regionId,
      raw_data: feed.rawData,
      processed_data: feed.processedData,
      confidence_score: feed.confidenceScore,
      relevance_score: feed.relevanceScore,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// User activity logging
export async function logUserActivity(activity: {
  userId: string
  action: string
  resourceType?: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}) {
  const { error } = await supabase
    .from('user_activity_logs')
    .insert({
      user_id: activity.userId,
      action: activity.action,
      resource_type: activity.resourceType,
      resource_id: activity.resourceId,
      details: activity.details,
      ip_address: activity.ipAddress,
      user_agent: activity.userAgent
    })
  
  if (error) console.error('Failed to log user activity:', error)
}

// Notification operations
export async function getUserNotifications(userId: string, unreadOnly?: boolean) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (unreadOnly) {
    query = query.eq('read', false)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createNotification(notification: {
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, any>
  priority?: string
}) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority || 'normal'
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
  
  if (error) throw error
}

// Historical data for ML training
export async function getHistoricalIncidents(options?: {
  regionId?: string
  category?: string
  startDate?: Date
  endDate?: Date
}) {
  let query = supabase
    .from('historical_incidents')
    .select('*')
    .order('incident_date', { ascending: false })
  
  if (options?.regionId) {
    query = query.eq('region_id', options.regionId)
  }
  if (options?.category) {
    query = query.eq('category', options.category)
  }
  if (options?.startDate) {
    query = query.gte('incident_date', options.startDate.toISOString().split('T')[0])
  }
  if (options?.endDate) {
    query = query.lte('incident_date', options.endDate.toISOString().split('T')[0])
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

// Real-time subscriptions
export function subscribeToRiskUpdates(callback: (payload: any) => void) {
  return supabase
    .channel('risk-updates')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'risk_assessments' 
      },
      callback
    )
    .subscribe()
}

export function subscribeToIncidentReports(callback: (payload: any) => void) {
  return supabase
    .channel('incident-updates')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'incident_reports' 
      },
      callback
    )
    .subscribe()
}

export function subscribeToNotifications(userId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}

// Utility functions
export function calculateRiskLevel(overallRisk: number): string {
  if (overallRisk >= 80) return 'critical'
  if (overallRisk >= 60) return 'high'
  if (overallRisk >= 40) return 'medium'
  return 'low'
}

export function generateRecommendation(riskLevel: string, category?: string): string {
  const recommendations = {
    critical: '🚨 CRITICAL: Immediate evacuation recommended. Emergency services activated.',
    high: '⚠️ HIGH: Prepare for potential evacuation. Monitor situation closely.',
    medium: '🟡 MEDIUM: Increase awareness. Prepare emergency supplies.',
    low: '✅ LOW: Normal operations. Continue routine monitoring.'
  }
  
  return recommendations[riskLevel as keyof typeof recommendations] || recommendations.low
}
