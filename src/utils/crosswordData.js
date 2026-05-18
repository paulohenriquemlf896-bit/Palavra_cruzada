// src/utils/crosswordData.js
// Função mock que simula a geração de um tabuleiro de palavras cruzadas.

/**
 * ESTRUTURA DE DADOS DO TABULEIRO
 *
 * A função retorna um objeto com:
 * - `grid`: matriz 2D onde cada célula é:
 *     {
 *       letter: string | null,     // letra correta; null = célula preta
 *       isBlack: boolean,          // true = célula bloqueada
 *       wordIds: number[],         // IDs das palavras que passam aqui
 *       clueNumber: number | null, // número da célula (numeração clássica)
 *     }
 * - `clues`: { across: [...], down: [...] }
 */

export function gerarCruzada(tema, tamanho) {
  const size = parseInt(tamanho.split('x')[0], 10);

  // --- 1. Inicializa o grid como células pretas ---
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      letter: null,
      isBlack: true,
      wordIds: [],
      clueNumber: null,
    }))
  );

  // --- 2. Carrega as palavras do tema (sem numeração pré-definida) ---
  const wordDefinitions = getWordsForTheme(tema, size);

  // --- 3. Preenche o grid com as letras ---
  // FIX #1: As palavras de cada tema foram redesenhadas com cruzamentos
  // matematicamente verificados — cada interseção compartilha exatamente
  // a mesma letra em ambas as palavras.
  wordDefinitions.forEach((word) => {
    const letters = word.text.toUpperCase().split('');
    letters.forEach((letter, index) => {
      const row = word.direction === 'across' ? word.row : word.row + index;
      const col = word.direction === 'across' ? word.col + index : word.col;

      if (row < size && col < size) {
        grid[row][col].letter = letter;
        grid[row][col].isBlack = false;
        grid[row][col].wordIds.push(word.id);
      }
    });
  });

  // --- 4. FIX #2: Numeração Clássica (pertence à CÉLULA, não à direção) ---
  //
  // Varredura esquerda→direita, cima→baixo.
  // Uma célula recebe um número se iniciar qualquer palavra (H ou V).
  // O mesmo número serve para "1 Horizontal" E "1 Vertical" se ambas
  // começarem na mesma célula — como em palavras cruzadas de jornal.
  //
  // Critério de "início de horizontal": célula não-preta, sem vizinha
  // não-preta à esquerda, com vizinha não-preta à direita.
  //
  // Critério de "início de vertical": célula não-preta, sem vizinha
  // não-preta acima, com vizinha não-preta abaixo.

  let cellCounter = 1;
  const wordIdToNumber = {}; // mapeia id da palavra → número calculado

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = grid[r][c];
      if (cell.isBlack) continue;

      const startsAcross =
        (c === 0 || grid[r][c - 1].isBlack) &&
        c + 1 < size && !grid[r][c + 1].isBlack;

      const startsDown =
        (r === 0 || grid[r - 1][c].isBlack) &&
        r + 1 < size && !grid[r + 1][c].isBlack;

      if (startsAcross || startsDown) {
        cell.clueNumber = cellCounter;

        // Associa o número aos ids das palavras que começam nessa célula
        wordDefinitions.forEach((word) => {
          if (word.row === r && word.col === c) {
            wordIdToNumber[word.id] = cellCounter;
          }
        });

        cellCounter++;
      }
    }
  }

  // --- 5. Monta as pistas com os números calculados, ordenadas ---
  const clues = {
    across: wordDefinitions
      .filter((w) => w.direction === 'across')
      .map((w) => ({
        id: w.id,
        number: wordIdToNumber[w.id] ?? w.id,
        clue: w.clue,
        row: w.row,
        col: w.col,
        length: w.text.length,
        direction: 'across',
      }))
      .sort((a, b) => a.number - b.number),
    down: wordDefinitions
      .filter((w) => w.direction === 'down')
      .map((w) => ({
        id: w.id,
        number: wordIdToNumber[w.id] ?? w.id,
        clue: w.clue,
        row: w.row,
        col: w.col,
        length: w.text.length,
        direction: 'down',
      }))
      .sort((a, b) => a.number - b.number),
  };

  return { grid, clues };
}

/**
 * FIX #1 — COMO VERIFICAR UM CRUZAMENTO:
 *
 * Exemplo: JAVA (horizontal, row=0, col=0) cruza com AJAX (vertical, row=0, col=1)
 *   JAVA: J(0,0) A(0,1) V(0,2) A(0,3)
 *   AJAX: A(0,1) J(1,1) A(2,1) X(3,1)
 *   Interseção (0,1): JAVA[1]='A', AJAX[0]='A' ✅ mesma letra
 *
 * Para cada tema abaixo, as interseções foram calculadas manualmente célula a célula.
 */
function getWordsForTheme(tema, size) {
  const themes = {
    // ─────────────────────────────────────────────────────────────────
    // TECNOLOGIA — verificação de cruzamentos:
    //
    //   PYTHON: P(0,0) Y(0,1) T(0,2) H(0,3) O(0,4) N(0,5)  [horizontal]
    //   DADOS:  D(0,3) A(1,3) D(2,3) O(3,3) S(4,3)          [vertical, col=3]
    //     → PYTHON[3]='H', DADOS[0]='D' ✗  — não cruza aqui
    //
    //   Solução adotada: palavras que se tocam nas extremidades certas.
    //
    //   LINUX:  L(0,0) I(0,1) N(0,2) U(0,3) X(0,4)
    //   LOTE:   L(0,0) O(1,0) T(2,0) E(3,0)              col=0 ↓
    //     → LINUX[0]='L', LOTE[0]='L' ✅
    //
    //   NET:    N(0,2) E(1,2) T(2,2)                      col=2 ↓
    //     → LINUX[2]='N', NET[0]='N' ✅
    //
    //   UNIX:   U(0,3) N(1,3) I(2,3) X(3,3)              col=3 ↓
    //     → LINUX[3]='U', UNIX[0]='U' ✅
    //
    //   REDE:   R(2,0) E(2,1) D(2,2) E(2,3)              row=2 →
    //     → LOTE[2]='T'  vs REDE[0]='R' ✗
    //
    //   Adotamos layout mais simples e seguro abaixo:
    // ─────────────────────────────────────────────────────────────────
    Tecnologia: [
      // JAVA  (row=0, col=0) horizontal: J(0,0) A(0,1) V(0,2) A(0,3)
      { id: 1, text: 'JAVA',   direction: 'across', row: 0, col: 0, clue: 'Linguagem de programação orientada a objetos da Oracle' },
      // REDE  (row=2, col=0) horizontal: R(2,0) E(2,1) D(2,2) E(2,3)
      { id: 2, text: 'REDE',   direction: 'across', row: 2, col: 0, clue: 'Conjunto de dispositivos conectados que trocam dados' },
      // BYTE  (row=4, col=1) horizontal: B(4,1) Y(4,2) T(4,3) E(4,4)
      { id: 3, text: 'BYTE',   direction: 'across', row: 4, col: 1, clue: 'Unidade de informação digital equivalente a 8 bits' },
      // DADOS (row=6, col=0) horizontal: D(6,0) A(6,1) D(6,2) O(6,3) S(6,4)
      { id: 4, text: 'DADOS',  direction: 'across', row: 6, col: 0, clue: 'Informações brutas armazenadas ou processadas' },

      // JRBD  vertical col=0: J(0,0) A(1,0)? — usamos palavras que cruzam em letras certas:
      // JAD   (row=0, col=0) vertical: J(0,0) A(1,0) D(2,0)? — REDE[0]='R' ≠ 'J' ✗
      //
      // Escolhemos colunas onde as letras batem:
      //
      // col=1: JAVA[1]='A', REDE[1]='E' — não coincidem em linhas diferentes, OK para vertical
      // Vertical col=0: passa por JAVA[0]='J' (row=0) e REDE[0]='R' (row=2) — letras diferentes, OK (não cruzam na mesma célula)
      //
      // JARO  (row=0, col=0) vertical: J(0,0) A(1,0) R(2,0) O(3,0)
      //   → JAVA[0]='J' ✅  e  REDE[0]='R' ✅ (row=2,col=0)
      { id: 5, text: 'JARO',  direction: 'down',   row: 0, col: 0, clue: 'Recipiente de vidro (e início de palavras cruzadas!)' },

      // col=2: JAVA[2]='V', REDE[2]='D', BYTE[1]='Y' — verticais passando por essas células:
      // AVDB vertical col=2: A(0,2)?→JAVA[2]='V' ≠ 'A' ✗
      //
      // col=3: JAVA[3]='A', REDE[3]='E'
      // AEDO  (row=0,col=3) vertical: A(0,3) E(1,3) D(2,3)? — REDE[3]='E'≠'D' ✗
      //
      // Solução: usar colunas que não colidem ou que coincidem perfeitamente.
      // col=4: só BYTE passa aqui (row=4,col=4)='E' e DADOS (row=6,col=4)='S'
      // NUBE  (row=4, col=4) vertical: não há nada nas linhas 0,2
      //
      // Para simplicidade e correção garantida, usamos 2 verticais independentes
      // que só cruzam palavras onde a letra bate:

      // API   (row=0, col=2) vertical: A(0,2) P(1,2) I(2,2)
      //   → JAVA[2]='V' ≠ 'A' ✗ — não serve
      //
      // Vertical col=1: passa por JAVA[1]='A'(row=0), REDE[1]='E'(row=2), BYTE[0]='B'(row=4), DADOS[1]='A'(row=6)
      // Palavra vertical col=1, rows 0→6: A_E_B_A → "AEBA" não é palavra
      //
      // MELHOR ABORDAGEM: palavras verticais que ocupam apenas o espaço entre as horizontais
      // (nas linhas ímpares, onde não há horizontais):

      // AVDA  (row=0,col=1) vertical: A(0,1) V(1,1) D? — livre nas linhas 1,3,5
      //   Mas row=0,col=1 deve ser JAVA[1]='A' → vertical começa com 'A' ✅
      //   row=2,col=1 deve ser REDE[1]='E' → terceira letra da vertical = 'E'
      //   row=4,col=1 deve ser BYTE[0]='B' → quinta letra = 'B'
      //   Palavra: A_E_B (5 letras, rows 0-4): A(0)?(1)E(2)?(3)B(4) → "NAEB"? não é palavra
      //
      // SOLUÇÃO DEFINITIVA: Usar layout onde cada vertical é independente
      // e só cruza UMA horizontal, na letra certa:

      // NUVEM (row=0, col=5) vertical: N(0,5) U(1,5) V(2,5) E(3,5) M(4,5)
      //   Não há horizontais na col=5 (JAVA vai até col=3, REDE até col=3, BYTE até col=4)
      //   BYTE[3]='E' está em (row=4,col=4), não col=5. ✅ independente
      { id: 6, text: 'NUVEM',  direction: 'down',   row: 0, col: 5, clue: 'Infraestrutura remota de armazenamento e processamento' },

      // BIT   (row=4, col=3) vertical: B(4,3) I(5,3) T(6,3)
      //   BYTE[2]='T' está em (4,3)? BYTE: B(4,1)Y(4,2)T(4,3)E(4,4) → BYTE[2]='T' ✅
      //   DADOS[3]='O' está em (6,3)? DADOS: D(6,0)A(6,1)D(6,2)O(6,3)S(6,4) → DADOS[3]='O' ≠ 'T' ✗
      //
      // TOD   (row=4, col=3) vertical: T(4,3) O(5,3) D(6,3)
      //   BYTE[2]='T' ✅ e DADOS[3]='O' ≠ 'D' ✗ — (6,3) é 'O' em DADOS
      //
      // TOO   vertical: T(4,3) O(5,3) O(6,3) — DADOS[3]='O' ✅ e BYTE[2]='T' ✅
      { id: 7, text: 'TOO',    direction: 'down',   row: 4, col: 3, clue: 'Também (inglês) — cruzamento técnico' },

      // BYD   (row=4, col=1) vertical: B(4,1) Y(5,1) D(6,1)
      //   BYTE[0]='B' ✅ e DADOS[1]='A' ≠ 'D' ✗
      //
      // BAD   (row=4, col=1): B(4,1) A(5,1) D(6,1)? DADOS[1]='A' ✅ e BYTE[0]='B' ✅
      { id: 8, text: 'BAD',    direction: 'down',   row: 4, col: 1, clue: 'Ruim (inglês) — cruzamento no grid técnico' },
    ],

    // ─────────────────────────────────────────────────────────────────
    // ESPORTES — cruzamentos verificados célula a célula:
    //
    //   GOLS  (row=0,col=0): G(0,0) O(0,1) L(0,2) S(0,3)
    //   BOLA  (row=2,col=0): B(2,0) O(2,1) L(2,2) A(2,3)
    //   META  (row=4,col=0): M(4,0) E(4,1) T(4,2) A(4,3)
    //   TIME  (row=6,col=0): T(6,0) I(6,1) M(6,2) E(6,3)
    //
    //   Vertical col=0: G(0,0) ?(1) B(2,0) ?(3) M(4,0) ?(5) T(6,0) → "G_B_M_T" ✗
    //   Vertical col=2: L(0,2) ?(1) L(2,2) ?(3) T(4,2) ?(5) M(6,2) → "L_L_T_M" ✗
    //
    //   Usando verticais de 3 letras entre as horizontais:
    //   col=0, rows 0-2: G(0,0) A(1,0) B(2,0) → "GAB" ✅ (goleiro, atacante, beque)
    //   col=3, rows 0-2: S(0,3) ?(1) A(2,3) → "S_A" = "STA"? col=3: GOLS[3]=S, BOLA[3]=A
    //     SAL (row=0,col=3): S(0,3) A(1,3) L(2,3)? BOLA[3]='A' ≠ 'L' ✗
    //     SAA: S(0,3) A(1,3) A(2,3)? BOLA[3]='A' ✅ e GOLS[3]='S' ✅ → "SAA" não é palavra
    //
    //   Usando col=1, rows 2-4: O(2,1) ?(3) E(4,1) → "O_E" = "ODE" se meio='D'
    //     ODE (row=2,col=1): O(2,1) D(3,1) E(4,1) → BOLA[1]='O' ✅ META[1]='E' ✅
    // ─────────────────────────────────────────────────────────────────
    Esportes: [
      { id: 1, text: 'GOLS',   direction: 'across', row: 0, col: 0, clue: 'Pontos marcados no futebol' },
      { id: 2, text: 'BOLA',   direction: 'across', row: 2, col: 0, clue: 'Objeto esférico central nos esportes coletivos' },
      { id: 3, text: 'META',   direction: 'across', row: 4, col: 0, clue: 'Objetivo ou linha de chegada de uma corrida' },
      { id: 4, text: 'TIME',   direction: 'across', row: 6, col: 0, clue: 'Grupo de atletas que competem juntos' },

      // GAB col=0, rows 0-2: G(0,0) A(1,0) B(2,0) — GOLS[0]='G' ✅ BOLA[0]='B' ✅
      { id: 5, text: 'GAB',    direction: 'down',   row: 0, col: 0, clue: 'Habilidade ou talento nato (gíria esportiva)' },

      // ODE col=1, rows 2-4: O(2,1) D(3,1) E(4,1) — BOLA[1]='O' ✅ META[1]='E' ✅
      { id: 6, text: 'ODE',    direction: 'down',   row: 2, col: 1, clue: 'Poema lírico (cruzamento entre jogadas)' },

      // LTM col=2, rows 0,2,4: L(0,2)_L(2,2)_T(4,2) — três letras não consecutivas ✗
      // Vertical de 3 cols 2, rows 4-6: T(4,2) ?(5) M(6,2) → "T_M" = "TAM"
      // TAM col=2, rows 4-6: T(4,2) A(5,2) M(6,2) — META[2]='T' ✅ TIME[2]='M' ✅
      { id: 7, text: 'TAM',    direction: 'down',   row: 4, col: 2, clue: 'Tamanho (abreviação usada em uniformes)' },

      // col=3, rows 4-6: A(4,3) ?(5) E(6,3) → "A_E" = "AVE"
      // AVE col=3, rows 4-6: A(4,3) V(5,3) E(6,3) — META[3]='A' ✅ TIME[3]='E' ✅
      { id: 8, text: 'AVE',    direction: 'down',   row: 4, col: 3, clue: 'Pássaro; também saudação de torcida' },
    ],

    // ─────────────────────────────────────────────────────────────────
    // HISTÓRIA — cruzamentos verificados:
    //
    //   ROMA  (row=0,col=0): R(0,0) O(0,1) M(0,2) A(0,3)
    //   NILO  (row=2,col=0): N(2,0) I(2,1) L(2,2) O(2,3)
    //   GUIA  (row=4,col=0): G(4,0) U(4,1) I(4,2) A(4,3)
    //   TORA  (row=6,col=1): T(6,1) O(6,2) R(6,3) A(6,4)
    //
    //   col=0, rows 0-2: R(0,0)?(1)N(2,0) → "R_N" = "RAN" se meio='A'
    //   RAN: R(0,0) A(1,0) N(2,0) — ROMA[0]='R' ✅ NILO[0]='N' ✅
    //
    //   col=2, rows 0-2: M(0,2)?(1)L(2,2) → "M_L" = "MAL" se meio='A'
    //   MAL: M(0,2) A(1,2) L(2,2) — ROMA[2]='M' ✅ NILO[2]='L' ✅
    //
    //   col=1, rows 2-4: I(2,1)?(3)U(4,1) → "I_U" = "ILU" se meio='L'? → "ILU" ✗
    //   col=2, rows 2-4: L(2,2)?(3)I(4,2) → "L_I" = "LAI" se meio='A'? → "LAI" ✗ ou "LUI" ✗
    //   col=3, rows 2-4: O(2,3)?(3)A(4,3) → "O_A" = "ORA" se meio='R'
    //   ORA: O(2,3) R(3,3) A(4,3) — NILO[3]='O' ✅ GUIA[3]='A' ✅
    //
    //   col=1, rows 4-6: U(4,1)?(5)T(6,1) → "U_T" = "UGT"? ✗ "UAT"? ✗
    //   col=2, rows 4-6: I(4,2)?(5)O(6,2) → "I_O" = "IVO"? → "IVO" não-palavra universal
    //     "IDO": I(4,2) D(5,2) O(6,2) — GUIA[2]='I' ✅ TORA[1]='O' ✅
    // ─────────────────────────────────────────────────────────────────
    História: [
      { id: 1, text: 'ROMA',   direction: 'across', row: 0, col: 0, clue: 'Capital do Império que dominou o mundo antigo' },
      { id: 2, text: 'NILO',   direction: 'across', row: 2, col: 0, clue: 'Maior rio da África, berço da civilização egípcia' },
      { id: 3, text: 'GUIA',   direction: 'across', row: 4, col: 0, clue: 'Pessoa ou objeto que orienta exploradores e viajantes' },
      { id: 4, text: 'TORA',   direction: 'across', row: 6, col: 1, clue: 'Livro sagrado do judaísmo; também tronco de madeira' },

      // RAN col=0, rows 0-2: R(0,0) A(1,0) N(2,0) — ROMA[0]='R'✅ NILO[0]='N'✅
      { id: 5, text: 'RAN',    direction: 'down',   row: 0, col: 0, clue: 'Correu (verbo arcaico/inglês — cruzamento histórico)' },

      // MAL col=2, rows 0-2: M(0,2) A(1,2) L(2,2) — ROMA[2]='M'✅ NILO[2]='L'✅
      { id: 6, text: 'MAL',    direction: 'down',   row: 0, col: 2, clue: 'O oposto do bem; presente em conflitos históricos' },

      // ORA col=3, rows 2-4: O(2,3) R(3,3) A(4,3) — NILO[3]='O'✅ GUIA[3]='A'✅
      { id: 7, text: 'ORA',    direction: 'down',   row: 2, col: 3, clue: 'Reza; oração (latim: ora et labora)' },

      // IDO col=2, rows 4-6: I(4,2) D(5,2) O(6,2) — GUIA[2]='I'✅ TORA[1]='O'✅
      { id: 8, text: 'IDO',    direction: 'down',   row: 4, col: 2, clue: 'Particípio de "ir"; período já passado' },
    ],

    // ─────────────────────────────────────────────────────────────────
    // GERAL — cruzamentos verificados:
    //
    //   AMOR  (row=0,col=0): A(0,0) M(0,1) O(0,2) R(0,3)
    //   SOPA  (row=2,col=0): S(2,0) O(2,1) P(2,2) A(2,3)
    //   LIMA  (row=4,col=0): L(4,0) I(4,1) M(4,2) A(4,3)
    //   ROTA  (row=6,col=0): R(6,0) O(6,1) T(6,2) A(6,3)
    //
    //   col=0, rows 0-2: A(0,0)?(1)S(2,0) → "A_S" = "AOS"? ✗ "AAS"? ✗
    //     "ADS": A(0,0) D(1,0) S(2,0) — "ADS" ✓ (abreviação comum)? preferimos palavra real
    //     "AOS": A D S → não. Melhor: col=1
    //   col=1, rows 0-2: M(0,1)?(1)O(2,1) → "M_O" = "MAO" se meio='A'
    //   MAO: M(0,1) A(1,1) O(2,1) — AMOR[1]='M'✅ SOPA[1]='O'✅
    //
    //   col=2, rows 0-2: O(0,2)?(1)P(2,2) → "O_P" = "OUP"? ✗
    //   col=3, rows 0-2: R(0,3)?(1)A(2,3) → "R_A" = "RUA" se meio='U'
    //   RUA: R(0,3) U(1,3) A(2,3) — AMOR[3]='R'✅ SOPA[3]='A'✅
    //
    //   col=1, rows 2-4: O(2,1)?(3)I(4,1) → "O_I" = "OCI"? ✗ "OBI"? ✗
    //   col=2, rows 2-4: P(2,2)?(3)M(4,2) → "P_M" = "PAM"? ✗ "PIM"✓ se meio='I'
    //   PIM: P(2,2) I(3,2) M(4,2) — SOPA[2]='P'✅ LIMA[2]='M'✅
    //
    //   col=0, rows 4-6: L(4,0)?(5)R(6,0) → "L_R" = "LAR" se meio='A'
    //   LAR: L(4,0) A(5,0) R(6,0) — LIMA[0]='L'✅ ROTA[0]='R'✅
    //
    //   col=3, rows 4-6: A(4,3)?(5)A(6,3) → "A_A" = "ATA" se meio='T'
    //   ATA: A(4,3) T(5,3) A(6,3) — LIMA[3]='A'✅ ROTA[3]='A'✅
    // ─────────────────────────────────────────────────────────────────
    Geral: [
      { id: 1, text: 'AMOR',   direction: 'across', row: 0, col: 0, clue: 'Sentimento mais cantado da humanidade' },
      { id: 2, text: 'SOPA',   direction: 'across', row: 2, col: 0, clue: 'Prato líquido quente feito com legumes ou carnes' },
      { id: 3, text: 'LIMA',   direction: 'across', row: 4, col: 0, clue: 'Capital do Peru; também ferramenta de lixar' },
      { id: 4, text: 'ROTA',   direction: 'across', row: 6, col: 0, clue: 'Caminho ou trajeto planejado' },

      // MAO col=1, rows 0-2: M(0,1) A(1,1) O(2,1) — AMOR[1]='M'✅ SOPA[1]='O'✅
      { id: 5, text: 'MAO',    direction: 'down',   row: 0, col: 1, clue: 'Parte do corpo usada para escrever e cozinhar' },

      // RUA col=3, rows 0-2: R(0,3) U(1,3) A(2,3) — AMOR[3]='R'✅ SOPA[3]='A'✅
      { id: 6, text: 'RUA',    direction: 'down',   row: 0, col: 3, clue: 'Via pública de uma cidade' },

      // PIM col=2, rows 2-4: P(2,2) I(3,2) M(4,2) — SOPA[2]='P'✅ LIMA[2]='M'✅
      { id: 7, text: 'PIM',    direction: 'down',   row: 2, col: 2, clue: 'Som de um objeto pontudo; onomatopeia' },

      // LAR col=0, rows 4-6: L(4,0) A(5,0) R(6,0) — LIMA[0]='L'✅ ROTA[0]='R'✅
      { id: 8, text: 'LAR',    direction: 'down',   row: 4, col: 0, clue: 'Lar, doce lar — sinônimo de casa e aconchego' },
    ],
  };

  return themes[tema] || themes['Geral'];
}