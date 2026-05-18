// src/screens/GameScreen.js
// Versão 2.0 — com foco visual, avanço automático e persistência AsyncStorage

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Keyboard, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CrosswordGrid from '../components/CrosswordGrid';
import { gerarCruzada } from '../utils/CrosswordGenerator';

// =============================================================================
// CHAVE DE ARMAZENAMENTO
// Formato: "cruzada_<tema>_<tamanho>" — uma entrada por configuração de jogo.
// Isso permite que o usuário tenha vários jogos salvos simultaneamente.
// =============================================================================
const storageKey = (tema, tamanho) => `cruzada_${tema}_${tamanho}`;

// =============================================================================
// FUNÇÕES DE PERSISTÊNCIA (AsyncStorage)
// Isoladas fora do componente para facilitar testes e reutilização futura.
// =============================================================================

/**
 * salvarProgresso — grava o estado atual do jogo no AsyncStorage.
 *
 * O que é salvo:
 *   - userAnswers: letras que o usuário digitou (matriz 2D)
 *   - gridData:    o tabuleiro gerado (grid + clues)
 *   - tema, tamanho: metadados do jogo
 *   - savedAt:     timestamp ISO para exibir "Salvo há X minutos" futuramente
 *
 * O que NÃO é salvo:
 *   - Estado de UI (célula ativa, destaque, direção) — esses são efêmeros
 *   - verificationResult — o usuário começa a verificação do zero ao voltar
 */
async function salvarProgresso(tema, tamanho, gridData, userAnswers) {
  try {
    const payload = JSON.stringify({
      tema,
      tamanho,
      gridData,
      userAnswers,
      savedAt: new Date().toISOString(),
    });
    await AsyncStorage.setItem(storageKey(tema, tamanho), payload);
    if (__DEV__) console.log('[Storage] Progresso salvo:', storageKey(tema, tamanho));
  } catch (err) {
    // Falha silenciosa — não interrompe o jogo por erro de storage
    if (__DEV__) console.warn('[Storage] Erro ao salvar:', err);
  }
}

/**
 * carregarProgresso — tenta recuperar um jogo salvo para este tema+tamanho.
 * Retorna o payload parseado ou null se não houver jogo salvo (ou se estiver corrompido).
 */
async function carregarProgresso(tema, tamanho) {
  try {
    const raw = await AsyncStorage.getItem(storageKey(tema, tamanho));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validação mínima da estrutura antes de usar
    if (!parsed.gridData || !parsed.userAnswers) return null;
    return parsed;
  } catch (err) {
    if (__DEV__) console.warn('[Storage] Erro ao carregar:', err);
    return null;
  }
}

/**
 * apagarProgresso — remove o jogo salvo desta configuração.
 * Chamada ao reiniciar ou ao completar o jogo com sucesso.
 */
async function apagarProgresso(tema, tamanho) {
  try {
    await AsyncStorage.removeItem(storageKey(tema, tamanho));
    if (__DEV__) console.log('[Storage] Progresso apagado:', storageKey(tema, tamanho));
  } catch (err) {
    if (__DEV__) console.warn('[Storage] Erro ao apagar:', err);
  }
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function GameScreen({ config, onGoHome }) {
  const tema    = config?.tema    ?? 'Tecnologia';
  const tamanho = config?.tamanho ?? '10x10';

  // ── Estado do tabuleiro ────────────────────────────────────────────────────
  const [gridData,    setGridData]    = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [gerando,     setGerando]     = useState(true);

  // ── Estado de foco e navegação ─────────────────────────────────────────────
  //
  // MELHORIA 1 — Separação entre "palavra ativa" e "célula ativa":
  //
  //   highlightedWordId → ID da PALAVRA selecionada (destaque azul claro na linha)
  //   activeCell        → coordenada EXATA da célula que recebe digitação (azul forte)
  //   currentDirection  → direção atual ('across' | 'down')
  //   activeClue        → pista exibida no painel superior
  //
  // Antes, selectedCell e highlightedWordId eram a mesma coisa.
  // Agora activeCell é o cursor preciso, e highlightedWordId pinta a palavra toda.
  const [activeCell,        setActiveCell]        = useState(null); // { row, col }
  const [highlightedWordId, setHighlightedWordId] = useState(null);
  const [currentDirection,  setCurrentDirection]  = useState('across');
  const [activeClue,        setActiveClue]        = useState(null);

  // ── Resultado da verificação ───────────────────────────────────────────────
  const [verificationResult, setVerificationResult] = useState(null);

  // ── Ref para debounce do salvamento automático ─────────────────────────────
  // Evita gravar no AsyncStorage a cada tecla — espera 800ms após a última digitação.
  const saveTimer = useRef(null);

  // =============================================================================
  // EFEITO DE INICIALIZAÇÃO
  // Tenta carregar jogo salvo; se não houver, gera um novo.
  // =============================================================================

  useEffect(() => {
    setGerando(true);

    const inicializar = async () => {
      // Tenta carregar progresso salvo primeiro
      const salvo = await carregarProgresso(tema, tamanho);

      if (salvo) {
        // Jogo encontrado no storage — pergunta se quer continuar
        Alert.alert(
          '♟ Jogo salvo encontrado',
          `Você tem um jogo de "${tema}" (${tamanho}) em andamento.\nDeseja continuar?`,
          [
            {
              text: 'Continuar',
              onPress: () => {
                setGridData(salvo.gridData);
                setUserAnswers(salvo.userAnswers);
                setGerando(false);
              },
            },
            {
              text: 'Novo Jogo',
              style: 'destructive',
              onPress: () => gerarNovo(),
            },
          ]
        );
      } else {
        gerarNovo();
      }
    };

    // setTimeout(0) cede o event loop ao React antes de processar,
    // garantindo que a tela de loading apareça antes do backtracking.
    const t = setTimeout(inicializar, 0);
    return () => clearTimeout(t);
  }, [tema, tamanho]);

  // Gera um novo tabuleiro do zero e limpa o storage desta config
  const gerarNovo = useCallback(() => {
    setGerando(true);
    setActiveCell(null);
    setActiveClue(null);
    setHighlightedWordId(null);
    setVerificationResult(null);

    setTimeout(() => {
      try {
        if (__DEV__) console.log('[GameScreen] Gerando novo:', { tema, tamanho });
        const data = gerarCruzada(tema, tamanho);
        if (!data) throw new Error('gerarCruzada retornou null');

        const size = parseInt(String(tamanho).split('x')[0], 10);
        const emptyAnswers = Array.from({ length: size }, () =>
          Array.from({ length: size }, () => '')
        );
        setGridData(data);
        setUserAnswers(emptyAnswers);
        // Apaga o jogo antigo ao gerar novo
        apagarProgresso(tema, tamanho);
      } catch (err) {
        console.error('[GameScreen] Erro ao gerar:', err);
        Alert.alert('Erro', 'Não foi possível gerar a cruzada. Tente outro tamanho.');
        onGoHome();
      } finally {
        setGerando(false);
      }
    }, 0);
  }, [tema, tamanho]);

  // =============================================================================
  // SALVAMENTO AUTOMÁTICO COM DEBOUNCE
  // Dispara 800ms após a última alteração em userAnswers.
  // =============================================================================

  useEffect(() => {
    if (!gridData || !userAnswers.length) return;

    // Cancela o timer anterior (debounce)
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      salvarProgresso(tema, tamanho, gridData, userAnswers);
    }, 800);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [userAnswers]); // dispara apenas quando o usuário digita

  // =============================================================================
  // MELHORIA 1 — handleCellPress: separa foco da célula do destaque da palavra
  // =============================================================================

  const handleCellPress = useCallback((row, col) => {
    if (!gridData) return;

    const cell = gridData.grid[row][col];
    if (!cell || cell.isBlack) return;

    // Se o usuário toca na mesma célula já ativa → alterna a direção
    let dir = currentDirection;
    if (activeCell?.row === row && activeCell?.col === col) {
      dir = dir === 'across' ? 'down' : 'across';
      setCurrentDirection(dir);
    }

    // Atualiza a célula ativa (cursor preciso — azul forte)
    setActiveCell({ row, col });
    setVerificationResult(null);

    // Encontra qual pista (na direção atual) contém esta célula
    const clue = encontrarPista(cell.wordIds, dir) ?? encontrarPista(cell.wordIds, dir === 'across' ? 'down' : 'across');

    if (clue) {
      setHighlightedWordId(clue.id);
      setActiveClue({ text: clue.clue, number: clue.number, direction: clue.direction });
      // Garante que a direção esteja em sincronia com a pista encontrada
      if (clue.direction !== dir) setCurrentDirection(clue.direction);
    }
  }, [gridData, activeCell, currentDirection]);

  // Helper: encontra a pista que contém algum dos wordIds na direção dada
  const encontrarPista = useCallback((wordIds, dir) => {
    if (!gridData) return null;
    const lista = dir === 'across' ? gridData.clues.across : gridData.clues.down;
    return lista.find(c => wordIds.includes(c.id)) ?? null;
  }, [gridData]);

  // =============================================================================
  // MELHORIA 2 — handleKeyPress: avanço automático e backspace inteligente
  //
  // LÓGICA DE AVANÇO (auto-advance):
  //   Ao digitar uma letra válida em (row, col):
  //     1. Salva a letra em userAnswers[row][col]
  //     2. Calcula a PRÓXIMA célula na direção atual que não seja preta
  //     3. Move activeCell para essa próxima célula
  //     4. Atualiza highlightedWordId se a próxima célula pertencer à mesma palavra
  //
  // LÓGICA DE BACKSPACE:
  //   Ao receber string vazia (tecla apagar):
  //     1. Se a célula atual tem letra → apaga a letra, fica na mesma célula
  //     2. Se a célula atual está vazia → volta para a célula ANTERIOR e apaga
  //
  // Esta função é chamada pelo CrosswordGrid com a tecla capturada,
  // não com o texto final do TextInput.
  // =============================================================================

  const handleKeyPress = useCallback((row, col, key) => {
    if (!gridData) return;

    if (key === 'BACKSPACE') {
      // Apaga e/ou recua
      const temLetra = userAnswers[row]?.[col] !== '';

      if (temLetra) {
        // Apaga a letra da célula atual sem mover o cursor
        atualizarLetra(row, col, '');
      } else {
        // Célula já vazia → recua para a anterior e apaga
        const anterior = celulaAnterior(row, col);
        if (anterior) {
          atualizarLetra(anterior.row, anterior.col, '');
          setActiveCell(anterior);
        }
      }
      return;
    }

    // Letra normal (A-Z): salva e avança
    if (/^[A-Z]$/.test(key)) {
      atualizarLetra(row, col, key);

      const proxima = proximaCelula(row, col);
      if (proxima) {
        setActiveCell(proxima);
        // Mantém o destaque na mesma palavra se a próxima célula fizer parte dela
        const cell = gridData.grid[proxima.row][proxima.col];
        if (cell && !cell.isBlack && !cell.wordIds.includes(highlightedWordId)) {
          // Próxima célula é de outra palavra — atualiza a pista exibida
          const clue = encontrarPista(cell.wordIds, currentDirection);
          if (clue) {
            setHighlightedWordId(clue.id);
            setActiveClue({ text: clue.clue, number: clue.number, direction: clue.direction });
          }
        }
      }
    }
  }, [gridData, userAnswers, currentDirection, highlightedWordId, activeCell]);

  // Atualiza uma célula em userAnswers de forma imutável
  const atualizarLetra = useCallback((row, col, letra) => {
    setUserAnswers(prev =>
      prev.map((r, ri) =>
        ri === row ? r.map((c, ci) => ci === col ? letra : c) : r
      )
    );
  }, []);

  // Calcula a PRÓXIMA célula válida na direção atual
  const proximaCelula = useCallback((row, col) => {
    if (!gridData) return null;
    const size = gridData.grid.length;

    if (currentDirection === 'across') {
      // Percorre para a direita dentro da linha
      for (let c = col + 1; c < size; c++) {
        if (!gridData.grid[row][c].isBlack) return { row, col: c };
      }
    } else {
      // Percorre para baixo dentro da coluna
      for (let r = row + 1; r < size; r++) {
        if (!gridData.grid[r][col].isBlack) return { row: r, col };
      }
    }
    return null; // fim da palavra — não avança
  }, [gridData, currentDirection]);

  // Calcula a célula ANTERIOR na direção atual (para backspace)
  const celulaAnterior = useCallback((row, col) => {
    if (!gridData) return null;

    if (currentDirection === 'across') {
      for (let c = col - 1; c >= 0; c--) {
        if (!gridData.grid[row][c].isBlack) return { row, col: c };
      }
    } else {
      for (let r = row - 1; r >= 0; r--) {
        if (!gridData.grid[r][col].isBlack) return { row: r, col };
      }
    }
    return null;
  }, [gridData, currentDirection]);

  // =============================================================================
  // VERIFICAÇÃO DE RESPOSTAS
  // =============================================================================

  const handleVerify = useCallback(() => {
    if (!gridData) return;
    Keyboard.dismiss();

    const result = gridData.grid.map((row, rIdx) =>
      row.map((cell, cIdx) => {
        if (cell.isBlack) return null;
        const letra = userAnswers[rIdx]?.[cIdx]?.toUpperCase() ?? '';
        if (!letra) return 'incorrect';
        return letra === cell.letter ? 'correct' : 'incorrect';
      })
    );

    setVerificationResult(result);

    const flat    = result.flat().filter(Boolean);
    const correct = flat.filter(r => r === 'correct').length;
    const total   = flat.length;

    if (correct === total) {
      apagarProgresso(tema, tamanho); // jogo completo → apaga o save
      Alert.alert('🎉 Parabéns!', 'Você completou a cruzada!', [
        { text: 'Novo Jogo', onPress: onGoHome },
      ]);
    } else {
      Alert.alert(
        '📊 Resultado',
        `✅ Corretas: ${correct} / ${total}\n❌ Incorretas: ${total - correct}\n\nLetras vermelhas precisam de correção.`
      );
    }
  }, [gridData, userAnswers, tema, tamanho]);

  // =============================================================================
  // REINICIAR
  // =============================================================================

  const handleReset = useCallback(() => {
    Alert.alert('Reiniciar?', 'Todas as letras serão apagadas e o jogo salvo removido.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reiniciar',
        style: 'destructive',
        onPress: () => {
          apagarProgresso(tema, tamanho);
          gerarNovo();
        },
      },
    ]);
  }, [tema, tamanho, gerarNovo]);

  // =============================================================================
  // TOQUE NA LISTA DE PISTAS (no rodapé)
  // Seleciona a primeira célula da palavra e atualiza todos os estados de foco.
  // =============================================================================

  const handleCluePress = useCallback((clue) => {
    setActiveCell({ row: clue.row, col: clue.col });
    setHighlightedWordId(clue.id);
    setCurrentDirection(clue.direction);
    setActiveClue({ text: clue.clue, number: clue.number, direction: clue.direction });
    setVerificationResult(null);
  }, []);

  // =============================================================================
  // RENDER
  // =============================================================================

  if (gerando || !gridData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingEmoji}>🧩</Text>
          <Text style={styles.loadingText}>Gerando cruzada...</Text>
          <Text style={styles.loadingSubText}>{tema} · {tamanho}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* ── BARRA SUPERIOR ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onGoHome} style={styles.topBtn}>
          <Text style={styles.topBtnTextRed}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>{tema.toUpperCase()}</Text>
        <TouchableOpacity onPress={handleReset} style={styles.topBtn}>
          <Text style={styles.topBtnTextGray}>↺</Text>
        </TouchableOpacity>
      </View>

      {/* ── PAINEL DA PISTA ATIVA ── */}
      <View style={styles.cluePanel}>
        {activeClue ? (
          <>
            <Text style={styles.cluePanelDir}>
              {activeClue.number}. {activeClue.direction === 'across' ? '→ Horizontal' : '↓ Vertical'}
            </Text>
            <Text style={styles.cluePanelText} numberOfLines={2}>
              {activeClue.text}
            </Text>
          </>
        ) : (
          <Text style={styles.cluePanelPlaceholder}>
            Toque em uma célula para ver a dica 💡
          </Text>
        )}
      </View>

      {/* ── TABULEIRO ── */}
      <View style={styles.gridWrapper}>
        <CrosswordGrid
          grid={gridData.grid}
          userAnswers={userAnswers}
          activeCell={activeCell}
          highlightedWordId={highlightedWordId}
          currentDirection={currentDirection}
          verificationResult={verificationResult}
          onCellPress={handleCellPress}
          onKeyPress={handleKeyPress}
        />
      </View>

      {/* ── LISTA DE PISTAS ── */}
      <ScrollView style={styles.cluesScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.cluesContainer}>
          <Text style={styles.cluesTitle}>→ Horizontais</Text>
          {gridData.clues.across.map(c => (
            <TouchableOpacity key={`a-${c.id}`} onPress={() => handleCluePress(c)}>
              <Text style={[styles.clueItem, highlightedWordId === c.id && styles.clueItemActive]}>
                {c.number}. {c.clue}
              </Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.cluesTitle, { marginTop: 10 }]}>↓ Verticais</Text>
          {gridData.clues.down.map(c => (
            <TouchableOpacity key={`d-${c.id}`} onPress={() => handleCluePress(c)}>
              <Text style={[styles.clueItem, highlightedWordId === c.id && styles.clueItemActive]}>
                {c.number}. {c.clue}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── BOTÃO VERIFICAR ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify} activeOpacity={0.85}>
          <Text style={styles.verifyBtnText}>✔ VERIFICAR RESPOSTAS</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// =============================================================================
// ESTILOS
// =============================================================================

const styles = StyleSheet.create({
  safeArea:         { flex: 1, backgroundColor: '#1a1a2e' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  loadingEmoji:     { fontSize: 48 },
  loadingText:      { color: '#e94560', fontSize: 20, fontWeight: '700' },
  loadingSubText:   { color: '#a0a0b0', fontSize: 14 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#16213e', borderBottomWidth: 1, borderBottomColor: '#0f3460',
  },
  topBtn:           { paddingVertical: 6, paddingHorizontal: 4 },
  topBtnTextRed:    { color: '#e94560', fontWeight: '700', fontSize: 14 },
  topBtnTextGray:   { color: '#a0a0b0', fontSize: 22, fontWeight: '700' },
  topTitle:         { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 2 },

  cluePanel: {
    backgroundColor: '#0f3460', paddingHorizontal: 16, paddingVertical: 10,
    minHeight: 56, justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
  },
  cluePanelDir:         { color: '#4fc3f7', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  cluePanelText:        { color: '#e2e2e2', fontSize: 14, fontWeight: '500', lineHeight: 20 },
  cluePanelPlaceholder: { color: '#666688', fontSize: 13, fontStyle: 'italic' },

  gridWrapper: {
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20,
    backgroundColor: '#1a1a2e',
  },

  cluesScroll:    { flex: 1, borderTopWidth: 1, borderTopColor: '#0f3460' },
  cluesContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  cluesTitle:     { color: '#4fc3f7', fontWeight: '800', fontSize: 13, letterSpacing: 1, marginBottom: 6 },
  clueItem:       { color: '#a0a0b0', fontSize: 13, paddingVertical: 4, lineHeight: 18 },
  clueItemActive: { color: '#e94560', fontWeight: '700' },

  bottomBar: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#16213e', borderTopWidth: 1, borderTopColor: '#0f3460',
  },
  verifyBtn: {
    backgroundColor: '#e94560', borderRadius: 12, paddingVertical: 15, alignItems: 'center',
    elevation: 6, shadowColor: '#e94560', shadowOpacity: 0.35, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  verifyBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
});