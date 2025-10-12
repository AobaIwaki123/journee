/**
 * Supabaseデータベースの型定義（Phase 8）
 * 
 * supabase gen types typescript コマンドで自動生成することも可能
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          image: string | null;
          google_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          image?: string | null;
          google_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          image?: string | null;
          google_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      itineraries: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          destination: string | null;
          start_date: string | null;
          end_date: string | null;
          duration: number | null;
          summary: string | null;
          total_budget: number | null;
          currency: string | null;
          status: 'draft' | 'completed' | 'archived';
          is_public: boolean | null;
          public_slug: string | null;
          published_at: string | null;
          view_count: number | null;
          allow_pdf_download: boolean | null;
          custom_message: string | null;
          phase: 'initial' | 'collecting' | 'skeleton' | 'detailing' | 'completed' | null;
          current_day: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          destination?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          duration?: number | null;
          summary?: string | null;
          total_budget?: number | null;
          currency?: string | null;
          status?: 'draft' | 'completed' | 'archived';
          is_public?: boolean | null;
          public_slug?: string | null;
          published_at?: string | null;
          view_count?: number | null;
          allow_pdf_download?: boolean | null;
          custom_message?: string | null;
          phase?: 'initial' | 'collecting' | 'skeleton' | 'detailing' | 'completed' | null;
          current_day?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          destination?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          duration?: number | null;
          summary?: string | null;
          total_budget?: number | null;
          currency?: string | null;
          status?: 'draft' | 'completed' | 'archived';
          is_public?: boolean | null;
          public_slug?: string | null;
          published_at?: string | null;
          view_count?: number | null;
          allow_pdf_download?: boolean | null;
          custom_message?: string | null;
          phase?: 'initial' | 'collecting' | 'skeleton' | 'detailing' | 'completed' | null;
          current_day?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      day_schedules: {
        Row: {
          id: string;
          itinerary_id: string;
          day: number;
          date: string | null;
          title: string | null;
          total_distance: number | null;
          total_cost: number | null;
          status: 'draft' | 'skeleton' | 'detailed' | 'completed' | null;
          theme: string | null;
          is_loading: boolean | null;
          error: string | null;
          progress: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          itinerary_id: string;
          day: number;
          date?: string | null;
          title?: string | null;
          total_distance?: number | null;
          total_cost?: number | null;
          status?: 'draft' | 'skeleton' | 'detailed' | 'completed' | null;
          theme?: string | null;
          is_loading?: boolean | null;
          error?: string | null;
          progress?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          itinerary_id?: string;
          day?: number;
          date?: string | null;
          title?: string | null;
          total_distance?: number | null;
          total_cost?: number | null;
          status?: 'draft' | 'skeleton' | 'detailed' | 'completed' | null;
          theme?: string | null;
          is_loading?: boolean | null;
          error?: string | null;
          progress?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tourist_spots: {
        Row: {
          id: string;
          day_schedule_id: string;
          name: string;
          description: string | null;
          scheduled_time: string | null;
          duration: number | null;
          category: 'sightseeing' | 'dining' | 'transportation' | 'accommodation' | 'other' | null;
          estimated_cost: number | null;
          notes: string | null;
          image_url: string | null;
          location_lat: number | null;
          location_lng: number | null;
          location_address: string | null;
          location_place_id: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          day_schedule_id: string;
          name: string;
          description?: string | null;
          scheduled_time?: string | null;
          duration?: number | null;
          category?: 'sightseeing' | 'dining' | 'transportation' | 'accommodation' | 'other' | null;
          estimated_cost?: number | null;
          notes?: string | null;
          image_url?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_address?: string | null;
          location_place_id?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          day_schedule_id?: string;
          name?: string;
          description?: string | null;
          scheduled_time?: string | null;
          duration?: number | null;
          category?: 'sightseeing' | 'dining' | 'transportation' | 'accommodation' | 'other' | null;
          estimated_cost?: number | null;
          notes?: string | null;
          image_url?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_address?: string | null;
          location_place_id?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          itinerary_id: string;
          role: 'user' | 'assistant';
          content: string | null;
          encrypted_content: string | null;
          is_encrypted: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          itinerary_id: string;
          role: 'user' | 'assistant';
          content?: string | null;
          encrypted_content?: string | null;
          is_encrypted?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          itinerary_id?: string;
          role?: 'user' | 'assistant';
          content?: string | null;
          encrypted_content?: string | null;
          is_encrypted?: boolean | null;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          encrypted_claude_api_key: string | null;
          ai_model_preference: string | null;
          app_settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          encrypted_claude_api_key?: string | null;
          ai_model_preference?: string | null;
          app_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          encrypted_claude_api_key?: string | null;
          ai_model_preference?: string | null;
          app_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          itinerary_id: string;
          user_id: string | null;
          author_name: string | null;
          content: string;
          is_anonymous: boolean | null;
          is_reported: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          itinerary_id: string;
          user_id?: string | null;
          author_name?: string | null;
          content: string;
          is_anonymous?: boolean | null;
          is_reported?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          itinerary_id?: string;
          user_id?: string | null;
          author_name?: string | null;
          content?: string;
          is_anonymous?: boolean | null;
          is_reported?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      save_encrypted_api_key: {
        Args: {
          p_user_id: string;
          p_api_key: string;
          p_encryption_key: string;
        };
        Returns: void;
      };
      get_decrypted_api_key: {
        Args: {
          p_user_id: string;
          p_encryption_key: string;
        };
        Returns: string | null;
      };
      encrypt_chat_message: {
        Args: {
          p_content: string;
          p_encryption_key: string;
        };
        Returns: string;
      };
      decrypt_chat_message: {
        Args: {
          p_encrypted_content: string;
          p_encryption_key: string;
        };
        Returns: string | null;
      };
      migrate_existing_chat_messages: {
        Args: {
          p_encryption_key: string;
        };
        Returns: void;
      };
      increment_view_count: {
        Args: {
          slug: string;
        };
        Returns: void;
      };
      search_itineraries: {
        Args: {
          user_id_param: string;
          search_query: string;
          limit_param?: number;
          offset_param?: number;
        };
        Returns: {
          id: string;
          title: string;
          destination: string;
          start_date: string;
          end_date: string;
          status: string;
          created_at: string;
          updated_at: string;
          rank: number;
        }[];
      };
      get_user_stats: {
        Args: {
          user_id_param: string;
        };
        Returns: Json;
      };
      clone_itinerary: {
        Args: {
          itinerary_id_param: string;
          user_id_param: string;
          new_title?: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
