insert into public.leads (
	nome,
	whatsapp,
	cidade,
	idade,
	contribuicao_anos,
	beneficio,
	situacao,
	score,
	classificacao,
	observacoes,
	consentimento,
	origem
) values
('João Silva', '+5511987654321', 'São Paulo/SP', 61, 34, 'aposentadoria', 'em-analise', 75, 'Alta', 'Pedido em fase final.', true, 'seed'),
('Maria Oliveira', '+5511976543210', 'Campinas/SP', 48, 18, 'auxilio-doenca', 'indeferido', 63, 'Média', 'Indeferimento recente.', true, 'seed'),
('Carlos Pereira', '+5511965432109', 'Guarulhos/SP', 37, 9, 'bpc-loas', 'primeiro-pedido', 46, 'Média', 'Busca orientação inicial.', true, 'seed');