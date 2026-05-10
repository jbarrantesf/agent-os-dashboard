-- ============================================================================
-- PHASE 1: Agent Floor 3D - Task Delegation Database Schema
-- Project: agent-floor-3d / NexAI Solutions CR
-- Autor: ORBIT (Automated Task Execution Engine)
-- Fecha: 2026-05-04
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- TABLE 1: agent_config
-- Almacena configuración de ambos agentes (ORBIT + Hermes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL UNIQUE,
  agent_type VARCHAR(20) NOT NULL CHECK (agent_type IN ('orchestrator', 'executor')),
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'paused')),
  model TEXT DEFAULT 'openrouter/anthropic/claude-haiku-4-5',
  max_concurrent_tasks INT DEFAULT 5,
  task_timeout_minutes INT DEFAULT 5,
  priority_strategy VARCHAR(20) DEFAULT 'fifo' CHECK (priority_strategy IN ('fifo', 'priority', 'lifo')),
  webhook_url TEXT,
  slack_channel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TABLE 2: agent_tasks
-- Almacena tareas que Hermes delega a ORBIT
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id TEXT UNIQUE NOT NULL, -- Hermes asigna este ID
  title TEXT NOT NULL,
  description TEXT,
  task_type VARCHAR(50) NOT NULL, -- 'code_review', 'deploy', 'data_sync', 'integration_test', etc.
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  
  -- Estado del ciclo de vida
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Creada por Hermes, esperando pickup
    'assigned',     -- ORBIT la confirmó
    'in_progress',  -- Ejecutando
    'completed',    -- Éxito
    'failed',       -- Error
    'retrying',     -- Reintentando
    'cancelled'     -- Cancelada
  )),
  
  -- Detalles de ejecución
  assigned_to UUID REFERENCES public.agent_config(id),
  created_by UUID REFERENCES public.agent_config(id),
  
  -- Payload
  input_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Retry tracking
  attempt_number INT DEFAULT 1,
  max_retries INT DEFAULT 3,
  last_error TEXT,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_task_type CHECK (task_type IN (
    'code_review', 'deploy', 'data_sync', 'integration_test',
    'email_send', 'report_generate', 'api_call', 'git_operation',
    'database_operation', 'terminal_command', 'custom'
  ))
);

-- ============================================================================
-- TABLE 3: agent_events
-- Historial de eventos: progreso, logs, errores
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'task_created',
    'task_assigned',
    'task_started',
    'task_progress',
    'task_completed',
    'task_failed',
    'task_retried',
    'task_cancelled',
    'agent_message',
    'error_occurred',
    'milestone_reached'
  )),
  
  agent_id UUID REFERENCES public.agent_config(id),
  
  -- Event details
  message TEXT,
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Severity level
  severity VARCHAR(10) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TABLE 4: agent_logs
-- Logs verbosos para debugging (truncados periódicamente)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agent_config(id),
  
  log_level VARCHAR(10) DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
  component TEXT, -- 'task_queue', 'executor', 'webhook', 'database', etc.
  message TEXT NOT NULL,
  
  context JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- TTL para auto-cleanup (30 días)
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + interval '30 days')
);

-- ============================================================================
-- INDEXES para optimizar queries
-- ============================================================================

-- agent_tasks indexes
CREATE INDEX idx_agent_tasks_status ON public.agent_tasks(status) WHERE status != 'completed';
CREATE INDEX idx_agent_tasks_assigned_to ON public.agent_tasks(assigned_to);
CREATE INDEX idx_agent_tasks_created_by ON public.agent_tasks(created_by);
CREATE INDEX idx_agent_tasks_priority_status ON public.agent_tasks(priority, status);
CREATE INDEX idx_agent_tasks_created_at ON public.agent_tasks(created_at DESC);
CREATE INDEX idx_agent_tasks_task_id ON public.agent_tasks(task_id);

-- agent_events indexes
CREATE INDEX idx_agent_events_task_id ON public.agent_events(task_id);
CREATE INDEX idx_agent_events_event_type ON public.agent_events(event_type);
CREATE INDEX idx_agent_events_created_at ON public.agent_events(created_at DESC);
CREATE INDEX idx_agent_events_agent_id ON public.agent_events(agent_id);
CREATE INDEX idx_agent_events_severity ON public.agent_events(severity);

-- agent_logs indexes
CREATE INDEX idx_agent_logs_task_id ON public.agent_logs(task_id);
CREATE INDEX idx_agent_logs_agent_id ON public.agent_logs(agent_id);
CREATE INDEX idx_agent_logs_created_at ON public.agent_logs(created_at DESC);
CREATE INDEX idx_agent_logs_level ON public.agent_logs(log_level);

-- agent_config indexes
CREATE INDEX idx_agent_config_status ON public.agent_config(status);
CREATE INDEX idx_agent_config_agent_type ON public.agent_config(agent_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can read/write all rows (service role)
-- This assumes authenticated agents have a specific role
CREATE POLICY "Allow agents to manage config" ON public.agent_config
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Allow agents to manage tasks" ON public.agent_tasks
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Allow agents to manage events" ON public.agent_events
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Allow agents to manage logs" ON public.agent_logs
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Get pending tasks for ORBIT (FIFO)
CREATE OR REPLACE FUNCTION public.get_pending_tasks(
  p_agent_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  task_id UUID,
  title TEXT,
  task_type VARCHAR,
  priority VARCHAR,
  input_data JSONB,
  attempt_number INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.task_type,
    t.priority,
    t.input_data,
    t.attempt_number
  FROM public.agent_tasks t
  WHERE t.status IN ('pending', 'retrying')
    AND (p_agent_id IS NULL OR t.assigned_to = p_agent_id)
  ORDER BY
    CASE
      WHEN t.priority = 'critical' THEN 1
      WHEN t.priority = 'high' THEN 2
      WHEN t.priority = 'normal' THEN 3
      ELSE 4
    END,
    t.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Procedure: Update task status and log event
CREATE OR REPLACE FUNCTION public.update_task_status(
  p_task_id UUID,
  p_new_status VARCHAR,
  p_event_type VARCHAR,
  p_message TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  error_msg TEXT
) AS $$
BEGIN
  -- Update task status
  UPDATE public.agent_tasks
  SET
    status = p_new_status,
    updated_at = CURRENT_TIMESTAMP,
    started_at = CASE WHEN p_new_status = 'in_progress' THEN CURRENT_TIMESTAMP ELSE started_at END,
    completed_at = CASE WHEN p_new_status IN ('completed', 'failed', 'cancelled') THEN CURRENT_TIMESTAMP ELSE completed_at END
  WHERE id = p_task_id;

  -- Log the event
  INSERT INTO public.agent_events (task_id, event_type, agent_id, message, event_data)
  VALUES (p_task_id, p_event_type, p_agent_id, p_message, COALESCE(p_event_data, '{}'::jsonb));

  RETURN QUERY SELECT TRUE::BOOLEAN, ''::TEXT;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT FALSE::BOOLEAN, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Procedure: Log message
CREATE OR REPLACE FUNCTION public.agent_log(
  p_task_id UUID DEFAULT NULL,
  p_agent_id UUID DEFAULT NULL,
  p_log_level VARCHAR DEFAULT 'info',
  p_component TEXT DEFAULT NULL,
  p_message TEXT DEFAULT NULL,
  p_context JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.agent_logs (task_id, agent_id, log_level, component, message, context)
  VALUES (p_task_id, p_agent_id, p_log_level, p_component, p_message, COALESCE(p_context, '{}'::jsonb))
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert Hermes (Orchestrator)
INSERT INTO public.agent_config (agent_name, agent_type, status, model, metadata)
VALUES (
  'Hermes',
  'orchestrator',
  'online',
  'openrouter/anthropic/claude-haiku-4-5',
  '{"role": "planning_and_monitoring", "session_id": "hermes-taskworker-e122e1c7-4f7f-4d87-bbc9-ad6997b7a6dd"}'::jsonb
)
ON CONFLICT (agent_name) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

-- Insert ORBIT (Executor)
INSERT INTO public.agent_config (agent_name, agent_type, status, model, metadata)
VALUES (
  'ORBIT',
  'executor',
  'online',
  'anthropic/claude-haiku-4-5',
  '{"role": "task_execution_and_deployment", "terminal_access": true, "subagents_enabled": true}'::jsonb
)
ON CONFLICT (agent_name) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.agent_config IS 'Configuration for agents (Hermes, ORBIT). Controls behavior, model, concurrency limits.';
COMMENT ON TABLE public.agent_tasks IS 'Tasks delegated by Hermes to ORBIT. Lifecycle from pending → completed/failed.';
COMMENT ON TABLE public.agent_events IS 'Event log for task progression. Used for real-time dashboards and monitoring.';
COMMENT ON TABLE public.agent_logs IS 'Verbose logs for debugging. Auto-cleaned after 30 days.';

COMMENT ON COLUMN public.agent_tasks.status IS 'Workflow state: pending → assigned → in_progress → completed/failed/cancelled';
COMMENT ON COLUMN public.agent_tasks.priority IS 'Execution priority: critical > high > normal > low';
COMMENT ON COLUMN public.agent_events.severity IS 'Log severity for filtering: debug < info < warning < error < critical';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Allow service role (used by agents) full access
GRANT ALL ON public.agent_config TO postgres;
GRANT ALL ON public.agent_tasks TO postgres;
GRANT ALL ON public.agent_events TO postgres;
GRANT ALL ON public.agent_logs TO postgres;

GRANT EXECUTE ON FUNCTION public.get_pending_tasks TO postgres;
GRANT EXECUTE ON FUNCTION public.update_task_status TO postgres;
GRANT EXECUTE ON FUNCTION public.agent_log TO postgres;

-- ============================================================================
-- FINAL STATUS
-- ============================================================================
-- Phase 1 Complete. Ready for:
-- - Hermes Phase 2 (TaskManager implementation)
-- - ORBIT Phase 3 (TaskQueue executor)
-- - Phase 4 Dashboard queries
-- ============================================================================
