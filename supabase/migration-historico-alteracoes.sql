-- ================================================================
-- Tabela de Histórico de Alterações de Leads
-- ================================================================

-- Criar tabela de histórico
CREATE TABLE IF NOT EXISTS public.lead_historico (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    usuario_nome text NOT NULL,
    usuario_id uuid,
    tipo_alteracao text NOT NULL, -- 'edicao', 'status', 'criacao'
    campo_alterado text,
    valor_anterior text,
    valor_novo text,
    descricao text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lead_historico_lead_id 
ON public.lead_historico(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_historico_created_at 
ON public.lead_historico(created_at DESC);

-- RLS policies
ALTER TABLE public.lead_historico ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ler histórico
CREATE POLICY "Usuários autenticados podem ler histórico"
ON public.lead_historico
FOR SELECT
TO authenticated
USING (true);

-- Usuários autenticados podem inserir histórico
CREATE POLICY "Usuários autenticados podem inserir histórico"
ON public.lead_historico
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Adicionar campos de auditoria na tabela leads (se não existirem)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS updated_by text;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- Comentários
-- ================================================================
COMMENT ON TABLE public.lead_historico IS 'Histórico de todas as alterações feitas em leads';
COMMENT ON COLUMN public.lead_historico.tipo_alteracao IS 'Tipo: edicao, status, criacao';
COMMENT ON COLUMN public.lead_historico.campo_alterado IS 'Nome do campo que foi alterado';
COMMENT ON COLUMN public.lead_historico.valor_anterior IS 'Valor antes da alteração (JSON text)';
COMMENT ON COLUMN public.lead_historico.valor_novo IS 'Valor após a alteração (JSON text)';
