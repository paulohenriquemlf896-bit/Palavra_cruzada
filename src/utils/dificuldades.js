// src/utils/dificuldades.js
// Fonte única de verdade para todas as regras de dificuldade.
// Importado por HomeScreen (UI) e GameScreen (lógica de jogo).

export const DIFICULDADES = {
  facil: {
    id:          'facil',
    label:       'Fácil',
    emoji:       '🟢',
    descricao:   'Grid menor, mais dicas. Perfeito para começar.',
    tamanho:     '8x8',
    dicas:       5,          // dicas por partida
    cor:         '#1b7a3e',  // verde escuro
    corClara:    '#d4f5e2',  // verde muito claro (badge)
    corTexto:    '#0a3d1f',  // texto sobre corClara
  },
  medio: {
    id:          'medio',
    label:       'Médio',
    emoji:       '🟡',
    descricao:   'Grid padrão, 3 dicas. O equilíbrio certo.',
    tamanho:     '10x10',
    dicas:       3,
    cor:         '#b07d00',  // âmbar escuro
    corClara:    '#fff3cc',
    corTexto:    '#5a3e00',
  },
  dificil: {
    id:          'dificil',
    label:       'Difícil',
    emoji:       '🔴',
    descricao:   'Grid grande, sem dicas. Só para especialistas.',
    tamanho:     '12x12',
    dicas:       0,          // zero dicas — sem piedade
    cor:         '#8b1a1a',  // vermelho escuro
    corClara:    '#fde8e8',
    corTexto:    '#5a0a0a',
  },
};

// Array ordenado para mapear facilmente na UI
export const DIFICULDADES_LISTA = [
  DIFICULDADES.facil,
  DIFICULDADES.medio,
  DIFICULDADES.dificil,
];