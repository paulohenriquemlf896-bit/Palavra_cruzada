// src/components/CrosswordGrid.js
// Versão 2.0 — foco visual preciso, captura de tecla nativa, sem TextInput por célula.

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Dimensions,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * CrosswordGrid v2
 * ────────────────
 * MUDANÇAS PRINCIPAIS em relação à v1:
 *
 * 1. UM ÚNICO TextInput invisível (o "captador de teclas")
 *    Em vez de um TextInput por célula — que causava conflitos de foco e
 *    dificultava o controle do cursor — usamos um único TextInput transparent
 *    posicionado fora da tela. Ele recebe todas as teclas e repassa via onKeyPress.
 *
 *    Por que? React Native não permite detectar "Backspace" em célula vazia
 *    com TextInput padrão (o evento não dispara se value === ''). O captador
 *    mantém sempre um caractere sentinela ('_') para garantir que o Backspace
 *    sempre dispare onKeyPress.
 *
 * 2. Dois níveis de destaque visual (Melhoria 1):
 *    - cellHighlighted: toda a palavra selecionada (azul claro)
 *    - cellFocused:     apenas a célula ativa / cursor (azul intenso + borda grossa)
 *
 * 3. Props recebidas:
 *    - grid, userAnswers, verificationResult  → dados de estado
 *    - activeCell          → { row, col } — célula com o cursor (azul forte)
 *    - highlightedWordId   → ID da palavra destacada (azul claro)
 *    - currentDirection    → 'across' | 'down'
 *    - onCellPress(r, c)   → usuário tocou em uma célula
 *    - onKeyPress(r, c, k) → usuário pressionou uma tecla ('A'..'Z' ou 'BACKSPACE')
 */
export default function CrosswordGrid({
  grid,
  userAnswers,
  activeCell,
  highlightedWordId,
  currentDirection,
  verificationResult,
  celulasReveladas = new Set(),  // Set<"row,col"> de células reveladas pela dica
  onCellPress,
  onKeyPress,
}) {
  // ── TextInput captador: único input real do teclado ────────────────────────
  const captorRef  = useRef(null);
  // Valor sentinela mantido no captador para garantir que Backspace sempre dispare
  const SENTINELA  = '_';

  const size      = grid.length;
  const GRID_PAD  = 4;
  const GRID_MAR  = 20;
  const CELL_SIZE = Math.floor((SCREEN_WIDTH - GRID_MAR * 2 - GRID_PAD * 2) / size);

  // Abre o teclado sempre que há uma célula ativa
  useEffect(() => {
    if (activeCell) {
      captorRef.current?.focus();
    }
  }, [activeCell]);

  // ── Captura de tecla ────────────────────────────────────────────────────────
  //
  // onKeyPress dispara ANTES de onChangeText — ideal para capturar Backspace.
  // Repassa a tecla para o GameScreen via onKeyPress(row, col, key).
  const handleKeyPress = useCallback((e) => {
    if (!activeCell) return;
    const key = e.nativeEvent.key;
    const chave = `${activeCell.row},${activeCell.col}`;

    // Células reveladas são somente leitura: ignora qualquer digitação.
    // O Backspace também é bloqueado — não faz sentido apagar uma dica.
    if (celulasReveladas.has(chave)) {
      // Permite apenas navegar (teclas de direção não chegam aqui, mas
      // se o usuário tentar digitar, avança para a próxima célula normal)
      return;
    }

    if (key === 'Backspace') {
      onKeyPress(activeCell.row, activeCell.col, 'BACKSPACE');
    } else if (/^[a-zA-Z]$/.test(key)) {
      onKeyPress(activeCell.row, activeCell.col, key.toUpperCase());
    }
  }, [activeCell, onKeyPress, celulasReveladas]);

  // Restaura o sentinela após qualquer digitação (para o próximo Backspace detectar)
  const handleChangeText = useCallback(() => {
    // Força o valor de volta ao sentinela sem disparar lógica de jogo
    captorRef.current?.setNativeProps({ text: SENTINELA });
  }, []);

  // ── Estilo dinâmico por célula ──────────────────────────────────────────────
  //
  // Hierarquia de prioridade (do mais alto ao mais baixo):
  //   1. Resultado de verificação (correct / incorrect) — estado pós-verificação
  //   2. cellFocused  — célula com o cursor ativo (azul forte)
  //   3. cellHighlighted — resto da palavra selecionada (azul claro)
  //   4. cellWhite    — célula normal sem seleção
  const getCellStyle = (row, col, cell) => {
    if (cell.isBlack) return null;

    const result      = verificationResult?.[row]?.[col];
    const isFocused   = activeCell?.row === row && activeCell?.col === col;
    const isHighlight = cell.wordIds.includes(highlightedWordId);
    const isRevealed  = celulasReveladas.has(`${row},${col}`);

    // Hierarquia de prioridade (do mais alto ao mais baixo):
    // verificação > revelada > cursor > destaque de palavra
    if (result === 'correct')   return styles.cellCorrect;
    if (result === 'incorrect') return styles.cellIncorrect;
    if (isRevealed && isFocused) return styles.cellRevealedFocused;
    if (isRevealed)             return styles.cellRevealed;  // dourado
    if (isFocused)              return styles.cellFocused;
    if (isHighlight)            return styles.cellHighlighted;
    return null;
  };

  // Cor do número da pista (garante contraste em todos os estados)
  const getClueNumColor = (result, isFocused, isHighlight, isRevealed) => {
    if (result === 'correct' || result === 'incorrect') return '#ffffff';
    if (isRevealed) return '#7a5500';   // marrom escuro sobre dourado
    if (isFocused)  return '#003060';
    if (isHighlight) return '#1a3a5a';
    return '#444455';
  };

  // Cor da letra digitada
  const getLetterColor = (result, isFocused, isRevealed) => {
    if (result === 'correct' || result === 'incorrect') return '#ffffff';
    if (isRevealed) return '#5a3e00';   // texto âmbar escuro sobre fundo dourado
    if (isFocused) return '#003060';
    return '#1a1a2e';
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View>
      {/* TextInput captador — invisível, fora do fluxo visual */}
      <TextInput
        ref={captorRef}
        defaultValue={SENTINELA}
        onKeyPress={handleKeyPress}
        onChangeText={handleChangeText}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        keyboardType="default"
        caretHidden
        style={styles.captor}
        // showSoftInputOnFocus: garante que o teclado abre no Android
        showSoftInputOnFocus={true}
      />

      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContainer}
        showsHorizontalScrollIndicator={false}
      >
        <View style={[styles.gridContainer, { padding: GRID_PAD }]}>
          {grid.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.gridRow}>
              {row.map((cell, colIndex) => {
                const cellKey   = `${rowIndex}-${colIndex}`;
                const result     = verificationResult?.[rowIndex]?.[colIndex];
                const isFocused  = activeCell?.row === rowIndex && activeCell?.col === colIndex;
                const isHL       = cell.wordIds.includes(highlightedWordId);
                const isRevealed = celulasReveladas.has(`${rowIndex},${colIndex}`);
                const dynStyle   = getCellStyle(rowIndex, colIndex, cell);

                if (cell.isBlack) {
                  return (
                    <View
                      key={cellKey}
                      style={[styles.cellBase, styles.cellBlack,
                        { width: CELL_SIZE, height: CELL_SIZE }]}
                    />
                  );
                }

                const numColor    = getClueNumColor(result, isFocused, isHL, isRevealed);
                const letterColor = getLetterColor(result, isFocused, isRevealed);
                const letra       = userAnswers[rowIndex]?.[colIndex] ?? '';

                return (
                  <TouchableOpacity
                    key={cellKey}
                    style={[
                      styles.cellBase, styles.cellWhite, dynStyle,
                      { width: CELL_SIZE, height: CELL_SIZE },
                    ]}
                    onPress={() => onCellPress(rowIndex, colIndex)}
                    activeOpacity={0.75}
                  >
                    {/* Número da pista no canto superior esquerdo */}
                    {cell.clueNumber !== null && (
                      <Text style={[styles.clueNum, {
                        fontSize: CELL_SIZE * 0.22,
                        color: numColor,
                      }]}>
                        {cell.clueNumber}
                      </Text>
                    )}

                    {/* Letra digitada pelo usuário */}
                    <Text style={[styles.cellLetter, {
                      fontSize: CELL_SIZE * 0.52,
                      color: letterColor,
                    }]}>
                      {letra}
                    </Text>

                    {/* Cursor piscante: pequeno sublinhado na célula ativa */}
                    {isFocused && !letra && !isRevealed && (
                      <View style={[styles.cursor, { width: CELL_SIZE * 0.4 }]} />
                    )}
                    {isRevealed && (
                      <Text style={[styles.revealIcon, { fontSize: CELL_SIZE * 0.2 }]}>
                        💡
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // TextInput invisível — fora da tela mas ativo para captura de teclado
  captor: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: -100,
    left: -100,
  },

  scrollContainer:  { flexGrow: 1, justifyContent: 'center' },
  gridContainer:    { backgroundColor: '#2a2a4a', borderRadius: 8 },
  gridRow:          { flexDirection: 'row' },

  cellBase: {
    borderWidth: 0.5,
    borderColor: '#3a3a5a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cellBlack:       { backgroundColor: '#1a1a2e' },
  cellWhite:       { backgroundColor: '#f5f5f0' },

  // Destaque suave: toda a palavra (azul claro)
  cellHighlighted: { backgroundColor: '#b3d4ff' },

  // Destaque forte: célula com o cursor (azul intenso + borda grossa)
  // MELHORIA 1: diferencia visualmente o cursor do destaque da palavra
  cellFocused: {
    backgroundColor: '#1976d2',
    borderColor: '#0d47a1',
    borderWidth: 2.5,
  },

  cellCorrect:   { backgroundColor: '#2e7d32' },
  cellIncorrect: { backgroundColor: '#c62828' },

  clueNum: {
    position: 'absolute',
    top: 1,
    left: 2,
    fontWeight: '700',
    lineHeight: 13,
  },

  cellLetter: {
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
  },

  // Cursor visual: pequena linha piscante quando a célula está vazia e focada
  cursor: {
    position: 'absolute',
    bottom: 4,
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
    opacity: 0.9,
  },

  // ── Células reveladas pela dica ──
  // Visual dourado/âmbar para distinguir claramente do esforço próprio do jogador.
  // Contraste AAA: fundo #f5c518 + texto #5a3e00 → ratio > 7:1.
  cellRevealed: {
    backgroundColor: '#f5c518',
    borderColor: '#c49a00',
    borderWidth: 1,
  },
  cellRevealedFocused: {
    backgroundColor: '#f5c518',
    borderColor: '#c49a00',
    borderWidth: 2.5,
  },
  revealIcon: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    lineHeight: 14,
  },
});