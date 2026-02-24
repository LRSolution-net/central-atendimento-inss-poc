// Script de diagnóstico - rode com: node test-supabase.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL    = 'https://bhargdkruycbrcanfvuz.supabase.co';
const SUPABASE_ANON   = 'sb_publishable_ROUFdAxC5BtCpMCr9oEzMw_zYukMCwX';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const leadTeste = {
    nome:              'Teste Diagnóstico',
    whatsapp:          '+5511999999999',
    cidade:            'São Paulo/SP',
    idade:             55,
    contribuicao_anos: 20,
    beneficio:         'aposentadoria',
    situacao:          'primeiro-pedido',
    score:             60,
    classificacao:     'Média',
    origem:            'teste-diagnostico',
    consentimento:     true,
    observacoes:       'Registro de teste — pode deletar.',
};

console.log('🔌 Conectando ao Supabase...');
console.log('   URL:', SUPABASE_URL);
console.log('   Key:', SUPABASE_ANON.slice(0, 20) + '...\n');

// 1. Testa INSERT
console.log('📝 Testando INSERT...');
const { error: insertError } = await supabase.from('leads').insert([leadTeste]);

if (insertError) {
    console.error('❌ INSERT FALHOU!');
    console.error('   Código:   ', insertError.code);
    console.error('   Mensagem: ', insertError.message);
    console.error('   Detalhes: ', insertError.details);
    console.error('   Hint:     ', insertError.hint);
} else {
    console.log('✅ INSERT OK — lead salvo com sucesso!\n');

    // 2. Confirma se aparece na tabela
    console.log('🔍 Verificando SELECT...');
    const { data, error: selectError } = await supabase
        .from('leads')
        .select('id, nome, created_at')
        .eq('origem', 'teste-diagnostico')
        .order('created_at', { ascending: false })
        .limit(1);

    if (selectError) {
        console.warn('⚠️  SELECT bloqueado (normal se RLS não liberar):', selectError.message);
    } else {
        console.log('✅ SELECT OK:', data);
    }
}
