import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vapcayynxymhonkhlwdm.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhcGNheXlueHltaG9ua2hsd2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDEyMjYsImV4cCI6MjA5NDc3NzIyNn0.Pgwp1bIf8tzgTqNh8ciw5b-b48w22mtIU3th_wOgNCQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export type Task = {
  id: string
  title: string
  description?: string
  status: 'triage' | 'todo' | 'in-progress' | 'blocked' | 'done'
  assigned_to?: string
  project?: string
  estimated_hours?: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  board: string
  created_at: string
  updated_at: string
}
