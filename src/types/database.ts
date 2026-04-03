/**
 * Database type definitions for CrisisLens
 * Generated from Supabase schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      regions: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          population: number
          area_km2: number
          center_lat: number
          center_lng: number
          infrastructure_score: number
          emergency_resources: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          population?: number
          area_km2?: number
          center_lat: number
          center_lng: number
          infrastructure_score?: number
          emergency_resources?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          population?: number
          area_km2?: number
          center_lat?: number
          center_lng?: number
          infrastructure_score?: number
          emergency_resources?: Json
          updated_at?: string
        }
      }
      incident_reports: {
        Row: {
          id: string
          region_id: string
          category: 'flood' | 'heat' | 'health' | 'supply' | 'infrastructure' | 'security'
          severity: number
          title: string
          description: string
          latitude: number | null
          longitude: number | null
          location_address: string | null
          reported_by: string | null
          verified: boolean
          verified_by: string | null
          verified_at: string | null
          status: 'active' | 'resolved' | 'investigating' | 'false_alarm'
          affected_people: number
          estimated_damage: number | null
          images: string[] | null
          sources: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          region_id: string
          category: 'flood' | 'heat' | 'health' | 'supply' | 'infrastructure' | 'security'
          severity: number
          title: string
          description: string
          latitude?: number | null
          longitude?: number | null
          location_address?: string | null
          reported_by?: string | null
          verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          status?: 'active' | 'resolved' | 'investigating' | 'false_alarm'
          affected_people?: number
          estimated_damage?: number | null
          images?: string[] | null
          sources?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          region_id?: string
          category?: 'flood' | 'heat' | 'health' | 'supply' | 'infrastructure' | 'security'
          severity?: number
          title?: string
          description?: string
          latitude?: number | null
          longitude?: number | null
          location_address?: string | null
          reported_by?: string | null
          verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          status?: 'active' | 'resolved' | 'investigating' | 'false_alarm'
          affected_people?: number
          estimated_damage?: number | null
          images?: string[] | null
          sources?: Json
          updated_at?: string
        }
      }
      risk_assessments: {
        Row: {
          id: string
          region_id: string
          flood_risk: number
          heat_risk: number
          health_risk: number
          supply_risk: number
          infrastructure_risk: number
          security_risk: number
          overall_risk: number
          confidence_score: number
          risk_level: 'low' | 'medium' | 'high' | 'critical'
          model_version: string
          features: Json
          feature_importance: Json
          prediction_timestamp: string
          valid_until: string | null
          created_at: string
        }
        Insert: {
          id?: string
          region_id: string
          flood_risk: number
          heat_risk: number
          health_risk: number
          supply_risk: number
          infrastructure_risk: number
          security_risk: number
          overall_risk: number
          confidence_score: number
          risk_level: 'low' | 'medium' | 'high' | 'critical'
          model_version?: string
          features?: Json
          feature_importance?: Json
          prediction_timestamp?: string
          valid_until?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          region_id?: string
          flood_risk?: number
          heat_risk?: number
          health_risk?: number
          supply_risk?: number
          infrastructure_risk?: number
          security_risk?: number
          overall_risk?: number
          confidence_score?: number
          risk_level?: 'low' | 'medium' | 'high' | 'critical'
          model_version?: string
          features?: Json
          feature_importance?: Json
          prediction_timestamp?: string
          valid_until?: string | null
        }
      }
      external_data_feeds: {
        Row: {
          id: string
          source: string
          data_type: string
          region_id: string | null
          raw_data: Json
          processed_data: Json
          confidence_score: number | null
          relevance_score: number | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          source: string
          data_type: string
          region_id?: string | null
          raw_data: Json
          processed_data?: Json
          confidence_score?: number | null
          relevance_score?: number | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          source?: string
          data_type?: string
          region_id?: string | null
          raw_data?: Json
          processed_data?: Json
          confidence_score?: number | null
          relevance_score?: number | null
          expires_at?: string | null
        }
      }
      historical_incidents: {
        Row: {
          id: string
          region_id: string
          incident_date: string
          category: string
          severity: number
          affected_area_km2: number
          economic_impact: number | null
          casualties: number
          response_time_hours: number
          resolution_days: number
          weather_conditions: Json
          contributing_factors: Json
          lessons_learned: string | null
          sources: Json
          created_at: string
        }
        Insert: {
          id?: string
          region_id: string
          incident_date: string
          category: string
          severity: number
          affected_area_km2?: number
          economic_impact?: number | null
          casualties?: number
          response_time_hours?: number
          resolution_days?: number
          weather_conditions?: Json
          contributing_factors?: Json
          lessons_learned?: string | null
          sources?: Json
          created_at?: string
        }
        Update: {
          id?: string
          region_id?: string
          incident_date?: string
          category?: string
          severity?: number
          affected_area_km2?: number
          economic_impact?: number | null
          casualties?: number
          response_time_hours?: number
          resolution_days?: number
          weather_conditions?: Json
          contributing_factors?: Json
          lessons_learned?: string | null
          sources?: Json
        }
      }
      user_activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          details: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: 'risk_alert' | 'incident_report' | 'system_update' | 'emergency'
          title: string
          message: string
          data: Json
          read: boolean
          read_at: string | null
          priority: 'low' | 'normal' | 'high' | 'urgent'
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: 'risk_alert' | 'incident_report' | 'system_update' | 'emergency'
          title: string
          message: string
          data?: Json
          read?: boolean
          read_at?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: 'risk_alert' | 'incident_report' | 'system_update' | 'emergency'
          title?: string
          message?: string
          data?: Json
          read?: boolean
          read_at?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          expires_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
