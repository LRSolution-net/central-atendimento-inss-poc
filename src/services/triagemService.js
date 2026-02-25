const PESO_BENEFICIO = {
    aposentadoria: 25,
    'auxilio-doenca': 20,
    'bpc-loas': 24,
    'beneficio-negado': 35,
    outros: 12,
};

const PESO_SITUACAO = {
    'primeiro-pedido': 10,
    'em-analise': 15,
    indeferido: 30,
    cessado: 26,
};

function scoreByContribuicao(contribuicaoAnos) {
    if (contribuicaoAnos >= 30) {
        return 18;
    }

    if (contribuicaoAnos >= 15) {
        return 12;
    }

    return 6;
}

function scoreByIdade(idade, sexo) {
    // Mulheres têm critérios de idade diferentes para aposentadoria
    const idadeMinima = sexo === 'feminino' ? 57 : 62;
    const idadeMeia = sexo === 'feminino' ? 40 : 45;
    
    if (idade >= idadeMinima) {
        return 18;
    }

    if (idade >= idadeMeia) {
        return 11;
    }

    return 6;
}

function classificar(score) {
    if (score >= 70) {
        return 'Alta';
    }

    if (score >= 45) {
        return 'Média';
    }

    return 'Baixa';
}

export function avaliarTriagem({ beneficio, situacao, idade, sexo, contribuicao_anos }) {
    const score =
        (PESO_BENEFICIO[beneficio] || 8) +
        (PESO_SITUACAO[situacao] || 8) +
        scoreByIdade(idade, sexo) +
        scoreByContribuicao(contribuicao_anos);

    const classificacao = classificar(score);

    return {
        score,
        classificacao,
        recomendacao:
            classificacao === 'Alta'
                ? 'Atendimento prioritário no mesmo dia.'
                : classificacao === 'Média'
                    ? 'Contato recomendado em até 24h.'
                    : 'Contato recomendado em até 48h.',
    };
}