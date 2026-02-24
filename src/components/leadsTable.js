export function renderResultadoTriagem(resultado) {
    const prioridadeClass =
        resultado.classificacao === 'Alta'
            ? 'chip-alta'
            : resultado.classificacao === 'Média'
                ? 'chip-media'
                : 'chip-baixa';

    return `
        <div class="resultado-card" role="status">
            <h3>Resultado da triagem</h3>
            <p>
                Prioridade: <span class="chip ${prioridadeClass}">${resultado.classificacao}</span>
            </p>
            <p>Score: <strong>${resultado.score}</strong></p>
            <p>${resultado.recomendacao}</p>
        </div>
    `;
}