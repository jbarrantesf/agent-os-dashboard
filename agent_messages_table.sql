-- ============================================================================
-- AGENT_MESSAGES TABLE — Comunicación Bidireccional Hermes ↔ ORBIT
-- Agregar a Supabase DESPUÉS de ejecutar agent-floor-3d-phase1-schema.sql
-- ============================================================================

-- Crear tabla de mensajes
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  from_agent TEXT NOT NULL CHECK (from_agent IN ('hermes', 'orbit')),
  to_agent TEXT NOT NULL CHECK (to_agent IN ('hermes', 'orbit')),
  
  message_type TEXT NOT NULL CHECK (message_type IN (
    'task',        -- Hermes → ORBIT: nueva tarea
    'result',      -- ORBIT → Hermes: resultado ejecución
    'status',      -- ORBIT → Hermes: actualización de estado
    'alert',       -- ORBIT → Hermes: alerta urgente
    'ack',         -- Cualquiera: confirmación de recibido
    'error'        -- ORBIT → Hermes: error en ejecución
  )),
  
  content JSONB NOT NULL,
  
  status TEXT DEFAULT 'unread' CHECK (status IN (
    'unread',      -- Creado, no leído aún
    'read',        -- Leído por destinatario
    'acked',       -- Confirmado con ACK
    'failed'       -- Error al procesar
  )),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,
  acked_at TIMESTAMP WITH TIME ZONE,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_agents CHECK (from_agent != to_agent)
);

-- ============================================================================
-- ÍNDICES para Performance
-- ============================================================================

CREATE INDEX idx_agent_messages_to_agent_status ON public.agent_messages(to_agent, status)
  WHERE status IN ('unread', 'read');

CREATE INDEX idx_agent_messages_created_at ON public.agent_messages(created_at DESC);

CREATE INDEX idx_agent_messages_from_agent ON public.agent_messages(from_agent);

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedure: Get unread messages for an agent
CREATE OR REPLACE FUNCTION public.get_unread_messages(p_agent_id TEXT)
RETURNS TABLE (
  message_id UUID,
  from_agent TEXT,
  message_type VARCHAR,
  content JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.from_agent,
    m.message_type,
    m.content,
    m.created_at
  FROM public.agent_messages m
  WHERE m.to_agent = p_agent_id
    AND m.status = 'unread'
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Procedure: Mark message as read
CREATE OR REPLACE FUNCTION public.mark_message_read(p_message_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.agent_messages
  SET
    status = 'read',
    read_at = CURRENT_TIMESTAMP
  WHERE id = p_message_id;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Procedure: Send message (from one agent to another)
CREATE OR REPLACE FUNCTION public.send_message(
  p_from_agent TEXT,
  p_to_agent TEXT,
  p_message_type TEXT,
  p_content JSONB,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  INSERT INTO public.agent_messages (from_agent, to_agent, message_type, content, metadata, status)
  VALUES (p_from_agent, p_to_agent, p_message_type, p_content, COALESCE(p_metadata, '{}'::jsonb), 'unread')
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.agent_messages TO postgres;
GRANT EXECUTE ON FUNCTION public.get_unread_messages TO postgres;
GRANT EXECUTE ON FUNCTION public.mark_message_read TO postgres;
GRANT EXECUTE ON FUNCTION public.send_message TO postgres;

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_messages;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.agent_messages IS 'Bidirectional communication between Hermes (orchestrator) and ORBIT (executor)';
COMMENT ON COLUMN public.agent_messages.status IS 'Message delivery status: unread → read → acked or failed';
COMMENT ON COLUMN public.agent_messages.message_type IS 'task: new task, result: execution result, status: update, alert: urgent, ack: confirmation, error: execution error';
