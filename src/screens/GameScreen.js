// src/screens/GameScreen.js
// Versão 3.0 — Layout Flexível e Responsivo (Botão fixo e Grid com scroll)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Keyboard, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CrosswordGrid from '../components/CrosswordGrid';
import { gerarCruzada } from '../utils/CrosswordGenerator';

const storageKey = (tema, tamanho) => `cruzada_${tema}_${tamanho}`;

async function salvarProgresso(tema, tamanho, gridData, userAnswers) {
  try {
    const payload = JSON.stringify({
      tema, tamanho, gridData, userAnswers,
      savedAt: new Date().toISOString(),
    });
    await AsyncStorage.setItem(storageKey(tema, tamanho), payload);
  } catch (err) {}
}

async function carregarProgresso(tema, tamanho) {
  try {
    const raw = await AsyncStorage.getItem(storageKey(tema, tamanho));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.gridData || !parsed.userAnswers) return null;
    return parsed;
  } catch (err) {
    return null;
  }
}

async function apagarProgresso(tema, tamanho) {
  try {
    await AsyncStorage.removeItem(storageKey(tema, tamanho));
  } catch (err) {}
}

export default function GameScreen({ config, onGoHome }) {
  const tema    = config?.tema    ?? 'Tecnologia';
  const tamanho = config?.tamanho ?? '10x10';

  const [gridData,    setGridData]    = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [gerando,     setGerando]     = useState(true);

  const [activeCell,        setActiveCell]        = useState(null);
  const [highlightedWordId, setHighlightedWordId] = useState(null);
  const [currentDirection,  setCurrentDirection]  = useState('across');
  const [activeClue,        setActiveClue]        = useState(null);

  const [verificationResult, setVerificationResult] = useState(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    setGerando(true);
    const inicializar = async () => {
      const salvo = await carregarProgresso(tema, tamanho);
      if (salvo) {
        Alert.alert(
          '♟ Jogo salvo encontrado',
          `Você tem um jogo de "${tema}" (${tamanho}) em andamento.\nDeseja continuar?`,
          [
            { text: 'Continuar', onPress: () => {
                setGridData(salvo.gridData);
                setUserAnswers(salvo.userAnswers);
                setGerando(false);
              }
            },
            { text: 'Novo Jogo', style: 'destructive', onPress: () => gerarNovo() },
          ]
        );
      } else {
        gerarNovo();
      }
    };
    const t = setTimeout(inicializar, 0);
    return () => clearTimeout(t);
  }, [tema, tamanho]);

  const gerarNovo = useCallback(() => {
    setGerando(true);
    setActiveCell(null);
    setActiveClue(null);
    setHighlightedWordId(null);
    setVerificationResult(null);

    setTimeout(() => {
      try {
        const data = gerarCruzada(tema, tamanho);
        if (!data) throw new Error('gerarCruzada retornou null');

        const size = parseInt(String(tamanho).split('x')[0], 10);
        const emptyAnswers = Array.from({ length: size }, () =>
          Array.from({ length: size }, () => '')
        );
        setGridData(data);
        setUserAnswers(emptyAnswers);
        apagarProgresso(tema, tamanho);
      } catch (err) {
        Alert.alert('Erro', 'Não foi possível gerar a cruzada. Tente outro tamanho.');
        onGoHome();
      } finally {
        setGerando(false);
      }
    }, 0);
  }, [tema, tamanho]);

  useEffect(() => {
    if (!gridData || !userAnswers.length) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      salvarProgresso(tema, tamanho, gridData, userAnswers);
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [userAnswers]);

  const handleCellPress = useCallback((row, col) => {
    if (!gridData) return;
    const cell = gridData.grid[row][col];
    if (!cell || cell.isBlack) return;

    let novaDirecao = currentDirection;
    if (activeCell?.row === row && activeCell?.col === col) {
      novaDirecao = currentDirection === 'across' ? 'down' : 'across';
    } else {
      const iniciaAcross = gridData.clues.across.some(c => c.row === row && c.col === col);
      const iniciaDown = gridData.clues.down.some(c => c.row === row && c.col === col);
      if (iniciaDown && !iniciaAcross) novaDirecao = 'down';
      else if (iniciaAcross && !iniciaDown) novaDirecao = 'across';
    }

    setCurrentDirection(novaDirecao);
    setActiveCell({ row, col });
    setVerificationResult(null);

    let clue = encontrarPista(cell.wordIds, novaDirecao);
    if (!clue) clue = encontrarPista(cell.wordIds, novaDirecao === 'across' ? 'down' : 'across');

    if (clue) {
      setHighlightedWordId(clue.id);
      setActiveClue({ text: clue.clue, number: clue.number, direction: clue.direction });
      if (clue.direction !== novaDirecao) setCurrentDirection(clue.direction);
    }
  }, [gridData, activeCell, currentDirection]);

  const encontrarPista = useCallback((wordIds, dir) => {
    if (!gridData) return null;
    const lista = dir === 'across' ? gridData.clues.across : gridData.clues.down;
    return lista.find(c => wordIds.includes(c.id)) ?? null;
  }, [gridData]);

  const handleKeyPress = useCallback((row, col, key) => {
    if (!gridData) return;

    if (key === 'BACKSPACE') {
      const temLetra = userAnswers[row]?.[col] !== '';
      if (temLetra) {
        atualizarLetra(row, col, '');
      } else {
        const anterior = celulaAnterior(row, col);
        if (anterior) {
          atualizarLetra(anterior.row, anterior.col, '');
          setActiveCell(anterior);
        }
      }
      return;
    }

    if (/^[A-Z]$/.test(key)) {
      atualizarLetra(row, col, key);
      const proxima = proximaCelula(row, col);
      if (proxima) {
        setActiveCell(proxima);
        const cell = gridData.grid[proxima.row][proxima.col];
        if (cell && !cell.isBlack && !cell.wordIds.includes(highlightedWordId)) {
          const clue = encontrarPista(cell.wordIds, currentDirection);
          if (clue) {
            setHighlightedWordId(clue.id);
            setActiveClue({ text: clue.clue, number: clue.number, direction: clue.direction });
          }
        }
      }
    }
  }, [gridData, userAnswers, currentDirection, highlightedWordId, activeCell]);

  const atualizarLetra = useCallback((row, col, letra) => {
    setUserAnswers(prev =>
      prev.map((r, ri) => ri === row ? r.map((c, ci) => ci === col ? letra : c) : r)
    );
  }, []);

  const proximaCelula = useCallback((row, col) => {
    if (!gridData) return null;
    const size = gridData.grid.length;
    if (currentDirection === 'across') {
      for (let c = col + 1; c < size; c++) {
        if (!gridData.grid[row][c].isBlack) return { row, col: c };
      }
    } else {
      for (let r = row + 1; r < size; r++) {
        if (!gridData.grid[r][col].isBlack) return { row: r, col };
      }
    }
    return null;
  }, [gridData, currentDirection]);

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
      apagarProgresso(tema, tamanho);
      Alert.alert('🎉 Parabéns!', 'Você completou a cruzada!', [{ text: 'Novo Jogo', onPress: onGoHome }]);
    } else {
      Alert.alert('📊 Resultado', `✅ Corretas: ${correct} / ${total}\n❌ Incorretas: ${total - correct}\n\nLetras vermelhas precisam de correção.`);
    }
  }, [gridData, userAnswers, tema, tamanho]);

  const handleReset = useCallback(() => {
    Alert.alert('Reiniciar?', 'Todas as letras serão apagadas e o jogo salvo removido.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Reiniciar', style: 'destructive', onPress: () => { apagarProgresso(tema, tamanho); gerarNovo(); } },
    ]);
  }, [tema, tamanho, gerarNovo]);

  const handleCluePress = useCallback((clue) => {
    setActiveCell({ row: clue.row, col: clue.col });
    setHighlightedWordId(clue.id);
    setCurrentDirection(clue.direction);
    setActiveClue({ text: clue.clue, number: clue.number, direction: clue.direction });
    setVerificationResult(null);
  }, []);

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
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onGoHome} style={styles.topBtn}>
            <Text style={styles.topBtnTextRed}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>{tema.toUpperCase()}</Text>
          <TouchableOpacity onPress={handleReset} style={styles.topBtn}>
            <Text style={styles.topBtnTextGray}>↺</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cluePanel}>
          {activeClue ? (
            <>
              <Text style={styles.cluePanelDir}>{activeClue.number}. {activeClue.direction === 'across' ? '→ Horizontal' : '↓ Vertical'}</Text>
              <Text style={styles.cluePanelText} numberOfLines={2}>{activeClue.text}</Text>
            </>
          ) : (
            <Text style={styles.cluePanelPlaceholder}>Toque em uma célula para ver a dica 💡</Text>
          )}
        </View>

        {/* MUDANÇA PRINCIPAL: Grid e Dicas compartilham o mesmo ScrollView para não expulsar o botão */}
        <ScrollView 
          style={styles.mainScroll} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

          <View style={styles.cluesContainer}>
            <Text style={styles.cluesTitle}>→ Horizontais</Text>
            {gridData.clues.across.map(c => (
              <TouchableOpacity key={`a-${c.id}`} onPress={() => handleCluePress(c)}>
                <Text style={[styles.clueItem, highlightedWordId === c.id && styles.clueItemActive]}>
                  {c.number}. {c.clue}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={[styles.cluesTitle, { marginTop: 16 }]}>↓ Verticais</Text>
            {gridData.clues.down.map(c => (
              <TouchableOpacity key={`d-${c.id}`} onPress={() => handleCluePress(c)}>
                <Text style={[styles.clueItem, highlightedWordId === c.id && styles.clueItemActive]}>
                  {c.number}. {c.clue}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Botão blindado no rodapé, sempre visível */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify} activeOpacity={0.85}>
            <Text style={styles.verifyBtnText}>✔ VERIFICAR RESPOSTAS</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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

  mainScroll: { flex: 1 },

  gridWrapper: {
    alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10,
  },

  cluesContainer: { 
    paddingHorizontal: 16, 
    paddingBottom: 24,
  },
  cluesTitle: { 
    color: '#4fc3f7', fontWeight: '800', fontSize: 13, letterSpacing: 1, marginBottom: 6 
  },
  clueItem: { 
    color: '#a0a0b0', fontSize: 13, paddingVertical: 6, lineHeight: 18 
  },
  clueItemActive: { 
    color: '#e94560', fontWeight: '700' 
  },

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