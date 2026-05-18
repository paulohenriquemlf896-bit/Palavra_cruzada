/**
 * CrosswordGenerator.js
 * =====================
 * Motor de geração procedural de palavras cruzadas — 100% offline.
 * Tradução fiel do algoritmo Python para JavaScript, otimizado para React Native.
 *
 * Exporta:
 *   gerarCruzada(tema, tamanho) → { grid, clues }
 *
 * O formato de retorno é idêntico ao esperado por CrosswordGrid.js e GameScreen.js.
 */

// =============================================================================
// 1. BANCO DE PALAVRAS
// =============================================================================

const BANCO = {
  Tecnologia: [
    { palavra: 'ALGORITMO',  dica: 'Sequencia de passos para resolver um problema' },
    { palavra: 'API',        dica: 'Interface que permite comunicacao entre sistemas' },
    { palavra: 'BACKEND',    dica: 'Parte do sistema que roda no servidor' },
    { palavra: 'BINARIO',    dica: 'Sistema numerico de base 2' },
    { palavra: 'BUFFER',     dica: 'Area de memoria temporaria entre processos' },
    { palavra: 'BYTE',       dica: 'Unidade de informacao com 8 bits' },
    { palavra: 'CACHE',      dica: 'Memoria rapida que guarda dados frequentes' },
    { palavra: 'CLOUD',      dica: 'Computacao em nuvem' },
    { palavra: 'CPU',        dica: 'Unidade central de processamento' },
    { palavra: 'DADOS',      dica: 'Informacoes brutas armazenadas digitalmente' },
    { palavra: 'DEBUG',      dica: 'Processo de encontrar e corrigir erros no codigo' },
    { palavra: 'DEPLOY',     dica: 'Ato de publicar uma aplicacao em producao' },
    { palavra: 'DOCKER',     dica: 'Plataforma de conteiner de software' },
    { palavra: 'FIREWALL',   dica: 'Barreira de seguranca entre redes' },
    { palavra: 'FRAMEWORK',  dica: 'Estrutura base para desenvolvimento de software' },
    { palavra: 'GIT',        dica: 'Sistema de controle de versao distribuido' },
    { palavra: 'HASH',       dica: 'Funcao que mapeia dados a um valor fixo' },
    { palavra: 'HTTP',       dica: 'Protocolo de transferencia de hipertexto' },
    { palavra: 'JAVA',       dica: 'Linguagem orientada a objetos da Oracle' },
    { palavra: 'JSON',       dica: 'Formato leve de troca de dados' },
    { palavra: 'KERNEL',     dica: 'Nucleo do sistema operacional' },
    { palavra: 'LATENCIA',   dica: 'Atraso na transmissao de dados em rede' },
    { palavra: 'LINUX',      dica: 'Sistema operacional de codigo aberto' },
    { palavra: 'MEMORIA',    dica: 'Componente que armazena dados temporariamente' },
    { palavra: 'NUVEM',      dica: 'Armazenamento e processamento remoto de dados' },
    { palavra: 'PIXEL',      dica: 'Menor elemento de uma imagem digital' },
    { palavra: 'PYTHON',     dica: 'Linguagem de programacao de alto nivel' },
    { palavra: 'QUERY',      dica: 'Consulta feita a um banco de dados' },
    { palavra: 'REDE',       dica: 'Conjunto de dispositivos interconectados' },
    { palavra: 'RUNTIME',    dica: 'Ambiente de execucao de um programa' },
    { palavra: 'SERVIDOR',   dica: 'Maquina que fornece servicos a clientes' },
    { palavra: 'SQL',        dica: 'Linguagem de consulta estruturada' },
    { palavra: 'TOKEN',      dica: 'Chave de autenticacao ou unidade minima lexical' },
    { palavra: 'VARIAVEL',   dica: 'Espaco nomeado de armazenamento na memoria' },
    { palavra: 'WIFI',       dica: 'Tecnologia de rede sem fio' },
    { palavra: 'XML',        dica: 'Linguagem de marcacao extensivel' },
  ],
  Geografia: [
    { palavra: 'AMAZONIA',   dica: 'Maior floresta tropical do planeta' },
    { palavra: 'ANDES',      dica: 'Principal cordilheira da America do Sul' },
    { palavra: 'ARTICO',     dica: 'Regiao polar do hemisferio norte' },
    { palavra: 'ATLAS',      dica: 'Colecao de mapas geograficos' },
    { palavra: 'BRASIL',     dica: 'Maior pais da America do Sul' },
    { palavra: 'CAPITAL',    dica: 'Cidade sede do governo de um pais' },
    { palavra: 'CLIMA',      dica: 'Padrao meteorologico de uma regiao ao longo do tempo' },
    { palavra: 'DELTA',      dica: 'Formacao triangular na foz de um rio' },
    { palavra: 'DESERTO',    dica: 'Regiao arida com pouca precipitacao' },
    { palavra: 'EQUADOR',    dica: 'Linha imaginaria que divide o globo ao meio' },
    { palavra: 'ESTEPE',     dica: 'Pradaria fria com vegetacao rasteira' },
    { palavra: 'EUROPA',     dica: 'Continente com maior densidade de paises' },
    { palavra: 'FJORDO',     dica: 'Enseada estreita entre montanhas escandinavas' },
    { palavra: 'GOLFO',      dica: 'Grande reentancia do mar em terra firme' },
    { palavra: 'ILHA',       dica: 'Porcao de terra cercada de agua por todos os lados' },
    { palavra: 'LATITUDE',   dica: 'Distancia angular ao norte ou sul do Equador' },
    { palavra: 'LITORAL',    dica: 'Faixa de terra ao longo do mar' },
    { palavra: 'LONGITUDE',  dica: 'Distancia angular a leste ou oeste do meridiano' },
    { palavra: 'MAPA',       dica: 'Representacao grafica de um territorio' },
    { palavra: 'MERIDIANO',  dica: 'Linha imaginaria de polo a polo' },
    { palavra: 'MONTANHA',   dica: 'Elevacao natural de grande altitude' },
    { palavra: 'NILO',       dica: 'Rio mais longo do mundo, na Africa' },
    { palavra: 'OCEANO',     dica: 'Grande massa de agua salgada' },
    { palavra: 'PANTANAL',   dica: 'Maior planicie alagada do mundo' },
    { palavra: 'PLANICIE',   dica: 'Extensao de terra plana e baixa' },
    { palavra: 'PLANALTO',   dica: 'Area elevada com superficie relativamente plana' },
    { palavra: 'POLO',       dica: 'Extremidade do eixo de rotacao terrestre' },
    { palavra: 'SAVANA',     dica: 'Bioma tropical com estacoes secas e chuvosas' },
    { palavra: 'TAIGA',      dica: 'Floresta boreal de coniferas do hemisferio norte' },
    { palavra: 'TROPICO',    dica: 'Paralelo a 23,5 graus de latitude' },
    { palavra: 'TSUNAMI',    dica: 'Onda gigante causada por abalo sismico' },
    { palavra: 'VALE',       dica: 'Depressao entre montanhas ou colinas' },
    { palavra: 'VULCAO',     dica: 'Abertura na crosta terrestre por onde sai magma' },
    { palavra: 'ZONA',       dica: 'Faixa ou regiao com caracteristicas comuns' },
  ],
  Historia: [
    { palavra: 'AFRICA',     dica: 'Segundo maior continente do mundo' },
    { palavra: 'ALIANCA',    dica: 'Acordo entre nacoes em tempos de guerra' },
    { palavra: 'ATENAS',     dica: 'Cidade-estado grega berco da democracia' },
    { palavra: 'AZTECA',     dica: 'Civilizacao pre-colombiana do Mexico' },
    { palavra: 'BATALHA',    dica: 'Combate entre exercitos em guerra' },
    { palavra: 'BRONZE',     dica: 'Liga metalica que deu nome a uma era historica' },
    { palavra: 'CESAR',      dica: 'Ditador romano assassinado nos Idos de Marco' },
    { palavra: 'CHINA',      dica: 'Civilizacao mais antiga em continuidade' },
    { palavra: 'COLONIA',    dica: 'Territorio dominado por uma metropole' },
    { palavra: 'CRUZADA',    dica: 'Campanha militar religiosa medieval' },
    { palavra: 'EGITO',      dica: 'Civilizacao das piramides e dos faraos' },
    { palavra: 'FARAO',      dica: 'Governante supremo do antigo Egito' },
    { palavra: 'FEUDAL',     dica: 'Sistema politico da Idade Media europeia' },
    { palavra: 'GLADIADOR',  dica: 'Lutador profissional da Roma antiga' },
    { palavra: 'GUERRA',     dica: 'Conflito armado entre nacoes' },
    { palavra: 'IMPERIO',    dica: 'Estado governado por um imperador' },
    { palavra: 'INCA',       dica: 'Civilizacao pre-colombiana dos Andes' },
    { palavra: 'MEDIEVAL',   dica: 'Relativo a Idade Media' },
    { palavra: 'MONARQUIA',  dica: 'Sistema de governo chefiado por um rei' },
    { palavra: 'MURAL',      dica: 'Pintura feita em parede, comum nas civilizacoes antigas' },
    { palavra: 'PAPIRO',     dica: 'Material de escrita usado no antigo Egito' },
    { palavra: 'REPUBLICA',  dica: 'Sistema de governo com eleicoes' },
    { palavra: 'ROMA',       dica: 'Capital do Imperio que dominou o mundo antigo' },
    { palavra: 'SECULO',     dica: 'Periodo de cem anos' },
    { palavra: 'TRATADO',    dica: 'Acordo formal entre nacoes' },
    { palavra: 'TROIA',      dica: 'Cidade da mitologia grega cercada por dez anos' },
  ],
  Esportes: [
    { palavra: 'ARBITRO',    dica: 'Responsavel por aplicar as regras em uma partida' },
    { palavra: 'ARENA',      dica: 'Local onde ocorrem competicoes esportivas' },
    { palavra: 'ATLETISMO',  dica: 'Modalidade olimpica com corridas, saltos e lancamentos' },
    { palavra: 'BOLA',       dica: 'Objeto esferico central em varios esportes' },
    { palavra: 'CAMPEAO',    dica: 'Vencedor de uma competicao' },
    { palavra: 'CHUTE',      dica: 'Golpe dado com o pe na bola' },
    { palavra: 'CORRIDA',    dica: 'Prova de velocidade a pe ou com veiculo' },
    { palavra: 'DEFESA',     dica: 'Acao de impedir o adversario de marcar' },
    { palavra: 'DRIBLE',     dica: 'Movimento de passar pelo adversario com a bola' },
    { palavra: 'ESTADIO',    dica: 'Local para partidas de futebol com arquibancadas' },
    { palavra: 'FINAL',      dica: 'Ultima partida de uma competicao' },
    { palavra: 'FUTEBOL',    dica: 'Esporte mais popular do mundo' },
    { palavra: 'GOLS',       dica: 'Pontos marcados no futebol' },
    { palavra: 'GOLEIRO',    dica: 'Jogador que defende o gol' },
    { palavra: 'LANCE',      dica: 'Jogada ou momento de uma partida' },
    { palavra: 'MEDALHA',    dica: 'Premio dado aos vencedores olimpicos' },
    { palavra: 'META',       dica: 'Objetivo ou linha de chegada de uma corrida' },
    { palavra: 'OLIMPIADA',  dica: 'Competicao esportiva internacional quadrienal' },
    { palavra: 'OURO',       dica: 'Medalha mais valiosa das Olimpiadas' },
    { palavra: 'PASSE',      dica: 'Acao de enviar a bola a um companheiro' },
    { palavra: 'PENALTI',    dica: 'Cobranca de falta dentro da area' },
    { palavra: 'PODIO',      dica: 'Plataforma onde sobem os tres primeiros colocados' },
    { palavra: 'RECORDE',    dica: 'Marca esportiva nunca antes alcancada' },
    { palavra: 'REGRA',      dica: 'Norma que rege um esporte' },
    { palavra: 'TENIS',      dica: 'Esporte com raquete e rede' },
    { palavra: 'TIME',       dica: 'Grupo de atletas que competem juntos' },
    { palavra: 'TORNEIO',    dica: 'Serie de competicoes eliminatorias' },
  ],
};

// =============================================================================
// 2. CONSTANTES
// =============================================================================

const ACROSS = 'across';
const DOWN   = 'down';

// =============================================================================
// 3. UTILITÁRIOS
// =============================================================================

/** Fisher-Yates shuffle in-place */
function embaralhar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

// =============================================================================
// 4. CLASSE GERADORA
// =============================================================================

class GeradorCruzada {
  constructor(size, candidatas) {
    this.size       = size;
    this.candidatas = candidatas;

    // Grid plano: índice = row * size + col. ' ' = vazio.
    // Array plano é ~3x mais rápido que array 2D em JS para acesso aleatório.
    this.cells    = new Array(size * size).fill(' ');

    // wordMap: Map<cellIndex, Set<pid>>
    // Rastreia quais placements passam por cada célula — busca O(1).
    this.wordMap  = new Map();

    // Lista de placements: { bancIdx, row, col, dir, palavra }
    this.placements = [];

    // Deadline em ms (Date.now() + limite)
    this._deadline = 0;
  }

  _idx(r, c)        { return r * this.size + c; }
  _get(r, c)        { return this.cells[this._idx(r, c)]; }
  _set(r, c, letra) { this.cells[this._idx(r, c)] = letra; }

  // ─────────────────────────────────────────────────────────────────────────
  // 4.1 MÉTODO PRINCIPAL
  // ─────────────────────────────────────────────────────────────────────────

  gerar(maxPalavras, limitMs) {
    this._deadline = Date.now() + limitMs;

    const indices = embaralhar([...Array(this.candidatas.length).keys()]);

    // ── Primeira palavra no centro ──────────────────────────────────────────
    for (const idx of indices) {
      const p = this.candidatas[idx].palavra;
      if (p.length > this.size) continue;

      const dir    = Math.random() < 0.5 ? ACROSS : DOWN;
      const centro = Math.floor(this.size / 2);
      const lin    = dir === ACROSS ? centro : centro - Math.floor(p.length / 2);
      const col    = dir === ACROSS ? centro - Math.floor(p.length / 2) : centro;

      if (this._podeColocar(p, lin, col, dir)) {
        this._colocar(idx, p, lin, col, dir);
        const sem = indices.filter(i => i !== idx);
        this._backtrack(sem, maxPalavras);
        return this.placements.length >= 3;
      }
    }
    return false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4.2 BACKTRACKING
  //
  // LÓGICA MATEMÁTICA:
  // ──────────────────
  // Para cada palavra candidata W de comprimento L e direção D:
  //
  //   ÂNCORAS: célula (r,c) onde grid[r][c] === W[k].
  //   POSIÇÃO INICIAL:
  //     ACROSS → (r,     c - k)
  //     DOWN   → (r - k, c    )
  //
  //   VALIDAÇÕES:
  //     R1. Limites do grid
  //     R2. Extremidades livres (evita fusão de palavras)
  //     R3. Célula vazia → adjacência perpendicular livre
  //         Mesma letra → interseção válida (direção oposta)
  //         Outra letra → colisão, descarta posição
  //
  //   PODAS:
  //     P1. Deadline de tempo — para ao esgotar o limite
  //     P2. Candidatas ordenadas por score de âncoras (mais âncoras → mais
  //         chance de encaixar → explora primeiro)
  //     P3. Posições embaralhadas → unicidade entre execuções
  //     P4. Verifica deadline dentro do loop de posições
  // ─────────────────────────────────────────────────────────────────────────

  _backtrack(restantes, maxP) {
    if (Date.now() > this._deadline)    return true; // P1: prazo esgotado
    if (this.placements.length >= maxP) return true;
    if (restantes.length === 0)         return true;

    const nivel   = this.placements.length;
    const dirPref = nivel % 2 === 0 ? ACROSS : DOWN;
    const dirAlt  = dirPref === ACROSS ? DOWN : ACROSS;

    // P2: ordena candidatas por número de letras em comum com o grid atual
    // (mais interseções potenciais → mais provável encaixar)
    const scoradas = restantes
      .map(idx => {
        const p = this.candidatas[idx].palavra;
        let s = p.length; // bônus de comprimento
        for (const ch of new Set(p)) {
          // conta células do grid que têm esta letra
          for (let i = 0; i < this.cells.length; i++) {
            if (this.cells[i] === ch) s++;
          }
        }
        return { idx, s };
      })
      .sort((a, b) => b.s - a.s);

    for (const { idx } of scoradas) {
      const p = this.candidatas[idx].palavra;
      if (p.length > this.size) continue;

      for (const dir of [dirAlt, dirPref]) {
        const posicoes = this._encontrarPosicoes(p, dir);
        embaralhar(posicoes); // P3

        for (const [lin, col] of posicoes) {
          if (Date.now() > this._deadline) return true; // P4

          if (this._podeColocar(p, lin, col, dir)) {
            this._colocar(idx, p, lin, col, dir);
            const novos = restantes.filter(i => i !== idx);
            this._backtrack(novos, maxP);
            // Nota: não desfazemos se atingimos o prazo — guardamos o resultado
            if (Date.now() > this._deadline) return true;
            // Só desfaz se ainda não atingimos o objetivo
            if (this.placements.length < maxP) {
              this._remover();
            } else {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4.3 ENCONTRAR ÂNCORAS
  // ─────────────────────────────────────────────────────────────────────────

  _encontrarPosicoes(palavra, dir) {
    const L    = palavra.length;
    const size = this.size;
    const seen = new Set();
    const res  = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const lg = this._get(r, c);
        if (lg === ' ') continue;

        for (let k = 0; k < L; k++) {
          if (palavra[k] !== lg) continue;
          const lin0 = dir === ACROSS ? r     : r - k;
          const col0 = dir === ACROSS ? c - k : c;

          if (dir === ACROSS) {
            if (col0 < 0 || col0 + L > size || lin0 < 0 || lin0 >= size) continue;
          } else {
            if (lin0 < 0 || lin0 + L > size || col0 < 0 || col0 >= size) continue;
          }

          const key = lin0 * 1000 + col0;
          if (!seen.has(key)) { seen.add(key); res.push([lin0, col0]); }
        }
      }
    }
    return res;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4.4 VALIDAÇÃO
  // ─────────────────────────────────────────────────────────────────────────

  _podeColocar(palavra, lin, col, dir) {
    const L = palavra.length;
    const S = this.size;

    // R1: limites
    if (dir === ACROSS) { if (col < 0 || col+L > S || lin < 0 || lin >= S) return false; }
    else                { if (lin < 0 || lin+L > S || col < 0 || col >= S) return false; }

    // R2: extremidades
    if (dir === ACROSS) {
      if (col-1 >= 0 && this._get(lin, col-1) !== ' ') return false;
      if (col+L <  S && this._get(lin, col+L) !== ' ') return false;
    } else {
      if (lin-1 >= 0 && this._get(lin-1, col) !== ' ') return false;
      if (lin+L <  S && this._get(lin+L, col) !== ' ') return false;
    }

    // R3: célula a célula
    for (let i = 0; i < L; i++) {
      const ri = dir === ACROSS ? lin : lin + i;
      const ci = dir === ACROSS ? col + i : col;
      const lc = this._get(ri, ci);

      if      (lc === ' ')       { if (!this._adjOk(ri, ci, dir))       return false; }
      else if (lc === palavra[i]){ if (!this._intersecaoValida(ri,ci,dir)) return false; }
      else                        { return false; }
    }
    return true;
  }

  _adjOk(r, c, dir) {
    const S = this.size;
    const viz = dir === ACROSS ? [[r-1,c],[r+1,c]] : [[r,c-1],[r,c+1]];
    for (const [vr,vc] of viz) {
      if (vr>=0 && vr<S && vc>=0 && vc<S && this._get(vr,vc) !== ' ') return false;
    }
    return true;
  }

  _intersecaoValida(r, c, dir) {
    const chave = this._idx(r, c);
    if (!this.wordMap.has(chave)) return false;
    for (const pid of this.wordMap.get(chave)) {
      if (this.placements[pid].dir !== dir) return true;
    }
    return false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4.5 COLOCAR / REMOVER
  // ─────────────────────────────────────────────────────────────────────────

  _colocar(bancIdx, palavra, lin, col, dir) {
    const pid = this.placements.length;
    this.placements.push({ bancIdx, lin, col, dir, palavra });
    for (let i = 0; i < palavra.length; i++) {
      const ri = dir === ACROSS ? lin : lin+i;
      const ci = dir === ACROSS ? col+i : col;
      this._set(ri, ci, palavra[i]);
      const k = this._idx(ri, ci);
      if (!this.wordMap.has(k)) this.wordMap.set(k, new Set());
      this.wordMap.get(k).add(pid);
    }
  }

  _remover() {
    if (!this.placements.length) return;
    const { palavra, lin, col, dir } = this.placements.pop();
    const pid = this.placements.length;
    for (let i = 0; i < palavra.length; i++) {
      const ri = dir === ACROSS ? lin : lin+i;
      const ci = dir === ACROSS ? col+i : col;
      const k  = this._idx(ri, ci);
      if (this.wordMap.has(k)) {
        this.wordMap.get(k).delete(pid);
        if (!this.wordMap.get(k).size) {
          this.wordMap.delete(k);
          this._set(ri, ci, ' ');
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4.6 NUMERAÇÃO CLÁSSICA
  //
  // Varredura esquerda→direita, cima→baixo.
  // Contador único por célula — se iniciar H e V ao mesmo tempo,
  // ambas as pistas compartilham o mesmo número.
  // ─────────────────────────────────────────────────────────────────────────

  calcularNumeracao() {
    const S   = this.size;
    const num = new Map(); // "r,c" → número
    let n = 1;
    for (let r = 0; r < S; r++) {
      for (let c = 0; c < S; c++) {
        if (this._get(r,c) === ' ') continue;
        const iH = (c===0 || this._get(r,c-1)===' ') && c+1<S && this._get(r,c+1)!==' ';
        const iV = (r===0 || this._get(r-1,c)===' ') && r+1<S && this._get(r+1,c)!==' ';
        if (iH || iV) num.set(`${r},${c}`, n++);
      }
    }
    return num;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4.7 CONSTRUIR SAÍDA — formato compatível com CrosswordGrid.js
  //
  // grid[r][c] = { letter, isBlack, wordIds, clueNumber }
  // clues = { across: [...], down: [...] }
  // ─────────────────────────────────────────────────────────────────────────

  construirSaida() {
    const S   = this.size;
    const num = this.calcularNumeracao();

    // Grid 2D
    const grid = Array.from({ length: S }, (_, r) =>
      Array.from({ length: S }, (_, c) => {
        const l = this._get(r, c);
        return {
          letter:     l === ' ' ? null : l,
          isBlack:    l === ' ',
          wordIds:    [],
          clueNumber: num.get(`${r},${c}`) ?? null,
        };
      })
    );

    // Preenche wordIds
    for (let pid = 0; pid < this.placements.length; pid++) {
      const { palavra, lin, col, dir } = this.placements[pid];
      for (let i = 0; i < palavra.length; i++) {
        const ri = dir === ACROSS ? lin : lin+i;
        const ci = dir === ACROSS ? col+i : col;
        grid[ri][ci].wordIds.push(pid);
      }
    }

    // Pistas
    const across = [], down = [];
    for (let pid = 0; pid < this.placements.length; pid++) {
      const { bancIdx, lin, col, dir, palavra } = this.placements[pid];
      const pista = {
        id:        pid,
        number:    num.get(`${lin},${col}`) ?? 0,
        clue:      this.candidatas[bancIdx].dica,
        row:       lin,
        col,
        length:    palavra.length,
        direction: dir,
      };
      if (dir === ACROSS) across.push(pista); else down.push(pista);
    }

    across.sort((a,b) => a.number - b.number);
    down.sort((a,b)   => a.number - b.number);

    return { grid, clues: { across, down } };
  }
}

// =============================================================================
// 5. FUNÇÃO EXPORTÁVEL PRINCIPAL
// =============================================================================

/**
 * gerarCruzada(tema, tamanho)
 * ───────────────────────────
 * @param {string} tema    — 'Tecnologia' | 'Geografia' | 'Historia' | 'Esportes'
 * @param {string} tamanho — "NxN" ex: "10x10"
 * @returns {{ grid, clues }} — pronto para CrosswordGrid.js e GameScreen.js
 *
 * OTIMIZAÇÕES PARA MOBILE:
 *   1. Grid plano (Array 1D) — acesso O(1) sem subarrays
 *   2. Map + Set para wordMap — inserção/busca O(1) amortizado
 *   3. Deadline global de 1500ms — UI nunca trava
 *   4. Score de âncoras — candidatas mais prováveis exploradas primeiro
 *   5. Set de posições vistas — elimina duplicatas em O(1)
 *   6. setTimeout(0) no GameScreen — cede o event loop antes de processar
 */
export function gerarCruzada(tema, tamanho) {
  // ── Validação e log de entrada ─────────────────────────────────────────────
  // Confirma os argumentos recebidos — útil para diagnosticar problemas de
  // passagem de parâmetros entre telas durante o desenvolvimento.
  if (__DEV__) {
    console.log('[CrosswordGenerator] gerarCruzada() chamada com:', { tema, tamanho });
  }

  const size = parseInt(String(tamanho).split('x')[0], 10);

  if (isNaN(size) || size < 5 || size > 25) {
    console.warn('[CrosswordGenerator] Tamanho invalido:', tamanho);
    return null;
  }

  // ── Busca do banco com fallback robusto ────────────────────────────────────
  // Tenta 3 estratégias em ordem:
  //   1. Chave exata (ex: 'Historia')
  //   2. Busca case-insensitive (ex: 'história' → 'Historia')
  //   3. Primeiro tema disponível como último recurso
  const chaveExata = BANCO[tema];
  const chaveNorm  = !chaveExata
    ? Object.keys(BANCO).find(k => k.toLowerCase() === String(tema).toLowerCase())
    : null;
  const banco = chaveExata || (chaveNorm ? BANCO[chaveNorm] : null) || BANCO[Object.keys(BANCO)[0]];

  if (__DEV__) {
    const temaResolvido = chaveExata ? tema : (chaveNorm ?? Object.keys(BANCO)[0]);
    if (temaResolvido !== tema) {
      console.warn('[CrosswordGenerator] Tema "' + tema + '" nao encontrado. Usando "' + temaResolvido + '".');
    } else {
      console.log('[CrosswordGenerator] Tema resolvido:', temaResolvido, '| Size:', size);
    }
  }

  const candidatas = banco.filter(p => p.palavra.length <= size && p.palavra.length >= 3);

  if (candidatas.length < 4) {
    console.warn('[CrosswordGenerator] Palavras insuficientes.');
    return null;
  }

  const maxP = Math.min(14, candidatas.length);

  // Deadline global: 1500ms cobre todas as tentativas.
  // Na prática, tabuleiros >= 10x10 terminam em < 200ms.
  // Para 8x8, o algoritmo para no deadline e retorna o melhor resultado parcial.
  const deadlineGlobal = Date.now() + 1500;
  let melhor = null;
  let melhorCount = 0;

  for (let t = 0; t < 5 && Date.now() < deadlineGlobal; t++) {
    const msRestantes = deadlineGlobal - Date.now();
    const g = new GeradorCruzada(size, candidatas);
    g.gerar(maxP, msRestantes);

    const saida = g.construirSaida();
    const total = saida.clues.across.length + saida.clues.down.length;

    if (total > melhorCount) {
      melhor = saida;
      melhorCount = total;
    }
    if (total >= maxP) break; // resultado ótimo, para imediatamente
  }

  // Fallback de segurança
  if (!melhor || melhorCount < 3) {
    const g = new GeradorCruzada(size, candidatas);
    g.gerar(3, 800);
    melhor = g.construirSaida();
  }

  return melhor;
}

export const TEMAS_DISPONIVEIS = Object.keys(BANCO);