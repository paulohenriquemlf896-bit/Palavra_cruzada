// src/screens/TutorialScreen.js
// Tutorial em 5 passos com mini-grid interativo e animações nativas.

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_W } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// CHAVE PARA MARCAR QUE O USUÁRIO JÁ VIU O TUTORIAL
// ─────────────────────────────────────────────────────────────────────────────
export const TUTORIAL_KEY = '@cruzapalavras_tutorial_done';

// ─────────────────────────────────────────────────────────────────────────────
// MINI-GRID ESTÁTICO
// Representa um tabuleiro 5×5 reduzido só para visualização.
// Cada célula: { letter, isBlack, clueNumber, highlight, active, correct, wrong }
// ─────────────────────────────────────────────────────────────────────────────

// Palavras plantadas:
//   JAVA  → horizontal, linha 0, col 0-3
//   REDE  → vertical,   col  2,  lin 0-3
//   DADOS → horizontal, linha 2, col 0-4

const BASE_GRID = [
  // linha 0:  J  A  V  A  _
  [
    { letter:'J', isBlack:false, clueNumber:1  },
    { letter:'A', isBlack:false, clueNumber:null },
    { letter:'V', isBlack:false, clueNumber:2  },  // começa REDE vertical
    { letter:'A', isBlack:false, clueNumber:null },
    { letter:null, isBlack:true },
  ],
  // linha 1:  _  _  E  _  _
  [
    { letter:null, isBlack:true },
    { letter:null, isBlack:true },
    { letter:'E', isBlack:false, clueNumber:null },
    { letter:null, isBlack:true },
    { letter:null, isBlack:true },
  ],
  // linha 2:  D  A  D  O  S   (DADOS horizontal, cruza com REDE na col2='D')
  [
    { letter:'D', isBlack:false, clueNumber:3  },
    { letter:'A', isBlack:false, clueNumber:null },
    { letter:'D', isBlack:false, clueNumber:null },
    { letter:'O', isBlack:false, clueNumber:null },
    { letter:'S', isBlack:false, clueNumber:null },
  ],
  // linha 3:  _  _  E  _  _
  [
    { letter:null, isBlack:true },
    { letter:null, isBlack:true },
    { letter:'E', isBlack:false, clueNumber:null },
    { letter:null, isBlack:true },
    { letter:null, isBlack:true },
  ],
  // linha 4:  _  _  _  _  _
  [
    { letter:null, isBlack:true },
    { letter:null, isBlack:true },
    { letter:null, isBlack:true },
    { letter:null, isBlack:true },
    { letter:null, isBlack:true },
  ],
];

// ─────────────────────────────────────────────────────────────────────────────
// DEFINIÇÃO DOS 5 PASSOS DO TUTORIAL
// Cada passo controla quais células ficam destacadas, qual tem o cursor,
// quais mostram letras corretas/erradas, e o texto explicativo.
// ─────────────────────────────────────────────────────────────────────────────
const PASSOS = [
  {
    titulo: 'O tabuleiro',
    subtitulo: 'Células brancas e pretas',
    descricao:
      'O jogo tem células BRANCAS onde você digita letras, e células PRETAS que separam as palavras. Cada número no canto de uma célula branca indica o início de uma palavra.',
    emoji: '🧩',
    // Nenhum destaque especial — mostra o grid limpo com números
    highlights: [],      // células destacadas (palavra inteira)
    cursor: null,        // célula com cursor ativo
    letras: {},          // letras digitadas: { "r,c": letra }
    corretas: [],        // células marcadas como corretas
    erradas: [],         // células marcadas como erradas
  },
  {
    titulo: 'Selecionar uma palavra',
    subtitulo: 'Toque para escolher',
    descricao:
      'Toque em qualquer célula branca para selecionar uma palavra. A palavra inteira fica destacada em AZUL CLARO, e a célula onde você vai digitar fica em AZUL ESCURO (o cursor).',
    emoji: '👆',
    highlights: [[0,0],[0,1],[0,2],[0,3]],   // JAVA horizontal destacada
    cursor: [0, 0],
    letras: {},
    corretas: [],
    erradas: [],
  },
  {
    titulo: 'Digitar as letras',
    subtitulo: 'Avança automaticamente',
    descricao:
      'Digite uma letra e o cursor avança sozinho para a próxima célula da palavra. Para apagar, use o Backspace — o cursor volta uma casa.',
    emoji: '⌨️',
    highlights: [[0,0],[0,1],[0,2],[0,3]],
    cursor: [0, 2],       // cursor na 3ª célula (usuário já digitou J, A)
    letras: { '0,0':'J', '0,1':'A' },   // J e A já digitados
    corretas: [],
    erradas: [],
  },
  {
    titulo: 'Palavras se cruzam',
    subtitulo: 'Interseções compartilham a mesma letra',
    descricao:
      'Palavras horizontais e verticais se cruzam. A célula de cruzamento pertence às duas ao mesmo tempo — a letra que você digitar deve ser certa para ambas!',
    emoji: '✂️',
    highlights: [[0,2],[1,2],[2,2],[3,2]],  // REDE vertical destacada
    cursor: [2, 2],         // interseção de JAVA e DADOS
    letras: { '0,0':'J','0,1':'A','0,2':'V','0,3':'A',
               '2,0':'D','2,1':'A',
               '1,2':'E','3,2':'E' },
    corretas: [],
    erradas: [],
  },
  {
    titulo: 'Verificar respostas',
    subtitulo: 'Verde = certo  ·  Vermelho = errado',
    descricao:
      'Quando terminar, toque em VERIFICAR RESPOSTAS. As células ficam verdes se a letra estiver correta, e vermelhas se estiver errada. Corrija as vermelhas e tente novamente!',
    emoji: '✅',
    highlights: [],
    cursor: null,
    letras: {
      '0,0':'J','0,1':'A','0,2':'V','0,3':'A',
      '1,2':'E',
      '2,0':'D','2,1':'A','2,2':'D','2,3':'O','2,4':'S',
      '3,2':'X',   // errada de propósito
    },
    corretas: [[0,0],[0,1],[0,2],[0,3],[1,2],[2,0],[2,1],[2,2],[2,3],[2,4]],
    erradas:  [[3,2]],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE MINI-GRID
// ─────────────────────────────────────────────────────────────────────────────

function MiniGrid({ passo }) {
  const CELL = Math.floor((SCREEN_W - 80) / 5);  // 5 colunas, margens de 40px cada

  const { highlights, cursor, letras, corretas, erradas } = passo;

  const hlSet  = new Set(highlights.map(([r,c]) => `${r},${c}`));
  const okSet  = new Set(corretas.map(([r,c])   => `${r},${c}`));
  const errSet = new Set(erradas.map(([r,c])    => `${r},${c}`));

  return (
    <View style={styles.miniGrid}>
      {BASE_GRID.map((row, ri) => (
        <View key={ri} style={styles.miniRow}>
          {row.map((cell, ci) => {
            const key  = `${ri},${ci}`;
            const isHL = hlSet.has(key);
            const isCursor = cursor && cursor[0] === ri && cursor[1] === ci;
            const isOk  = okSet.has(key);
            const isErr = errSet.has(key);
            const letra = letras[key] ?? '';

            if (cell.isBlack) {
              return (
                <View key={ci} style={[styles.miniCell, styles.miniBlack,
                  { width: CELL, height: CELL }]} />
              );
            }

            let bg = '#f5f5f0';
            if (isOk)     bg = '#2e7d32';
            else if (isErr) bg = '#c62828';
            else if (isCursor) bg = '#1976d2';
            else if (isHL) bg = '#b3d4ff';

            const numColor = (isOk || isErr) ? '#fff'
              : isCursor ? '#003060'
              : isHL ? '#1a3a5a'
              : '#444455';

            const letColor = (isOk || isErr || isCursor) ? '#fff' : '#1a1a2e';

            return (
              <View key={ci} style={[
                styles.miniCell, styles.miniWhite,
                { width: CELL, height: CELL, backgroundColor: bg },
                isCursor && styles.miniCursor,
              ]}>
                {cell.clueNumber !== null && (
                  <Text style={[styles.miniNum,
                    { fontSize: CELL * 0.22, color: numColor }]}>
                    {cell.clueNumber}
                  </Text>
                )}
                <Text style={[styles.miniLetter,
                  { fontSize: CELL * 0.48, color: letColor }]}>
                  {letra}
                </Text>
                {isCursor && !letra && (
                  <View style={[styles.miniCursorLine, { width: CELL * 0.4 }]} />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function TutorialScreen({ onFinish }) {
  const [step, setStep] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim     = useRef(new Animated.Value(1)).current;

  const total = PASSOS.length;
  const passo = PASSOS[step];
  const isLast = step === total - 1;

  // Anima a barra de progresso sempre que o passo muda
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / total,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [step]);

  // Transição de fade entre passos
  const irPara = (novoStep) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setStep(novoStep);
  };

  const avancar = () => {
    if (isLast) {
      concluir();
    } else {
      irPara(step + 1);
    }
  };

  const voltar = () => {
    if (step > 0) irPara(step - 1);
  };

  // Marca o tutorial como visto no AsyncStorage e chama onFinish
  const concluir = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_KEY, 'done');
    } catch (_) {}
    onFinish();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* ── CABEÇALHO ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={concluir} style={styles.skipBtn}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Como Jogar</Text>
        <View style={styles.stepCounter}>
          <Text style={styles.stepCounterText}>{step + 1}/{total}</Text>
        </View>
      </View>

      {/* ── BARRA DE PROGRESSO ── */}
      <View style={styles.progressTrack}>
        <Animated.View style={[
          styles.progressFill,
          { width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            })
          }
        ]} />
      </View>

      {/* ── CONTEÚDO COM FADE ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Emoji ilustrativo */}
          <Text style={styles.emoji}>{passo.emoji}</Text>

          {/* Títulos */}
          <Text style={styles.titulo}>{passo.titulo}</Text>
          <Text style={styles.subtitulo}>{passo.subtitulo}</Text>

          {/* Mini-grid interativo */}
          <MiniGrid passo={passo} />

          {/* Texto explicativo */}
          <View style={styles.descricaoBox}>
            <Text style={styles.descricao}>{passo.descricao}</Text>
          </View>

          {/* Indicadores de passo (bolinhas) */}
          <View style={styles.dots}>
            {PASSOS.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => irPara(i)}>
                <View style={[
                  styles.dot,
                  i === step && styles.dotActive,
                  i < step  && styles.dotDone,
                ]} />
              </TouchableOpacity>
            ))}
          </View>

        </Animated.View>
      </ScrollView>

      {/* ── BOTÕES DE NAVEGAÇÃO ── */}
      <View style={styles.navBar}>
        {step > 0 ? (
          <TouchableOpacity style={styles.btnVoltar} onPress={voltar}>
            <Text style={styles.btnVoltarText}>← Anterior</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.btnPlaceholder} />
        )}

        <TouchableOpacity
          style={[styles.btnAvancar, isLast && styles.btnAvancarLast]}
          onPress={avancar}
          activeOpacity={0.85}
        >
          <Text style={styles.btnAvancarText}>
            {isLast ? '🎮  Jogar Agora!' : 'Próximo →'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  // ── Cabeçalho ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  skipBtn:         { paddingVertical: 4, paddingHorizontal: 4, minWidth: 48 },
  skipText:        { color: '#a0a0b0', fontSize: 14 },
  headerTitle:     { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 2 },
  stepCounter:     { minWidth: 48, alignItems: 'flex-end' },
  stepCounterText: { color: '#4fc3f7', fontSize: 13, fontWeight: '700' },

  // ── Barra de progresso ──
  progressTrack: {
    height: 3,
    backgroundColor: '#0f3460',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 2,
  },

  // ── Conteúdo ──
  emoji:    { fontSize: 52, marginTop: 28, marginBottom: 8, textAlign: 'center' },
  titulo:   { fontSize: 22, fontWeight: '900', color: '#ffffff', textAlign: 'center', letterSpacing: 0.5 },
  subtitulo:{ fontSize: 14, color: '#4fc3f7', textAlign: 'center', marginTop: 4, marginBottom: 20, fontWeight: '600' },

  // ── Mini-grid ──
  miniGrid: {
    backgroundColor: '#2a2a4a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  miniRow:  { flexDirection: 'row' },
  miniCell: {
    borderWidth: 0.5,
    borderColor: '#3a3a5a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  miniBlack:  { backgroundColor: '#1a1a2e' },
  miniWhite:  { backgroundColor: '#f5f5f0' },
  miniCursor: { borderColor: '#0d47a1', borderWidth: 2 },
  miniNum: {
    position: 'absolute',
    top: 1, left: 2,
    fontWeight: '700',
    lineHeight: 12,
  },
  miniLetter: {
    fontWeight: '800',
    textAlign: 'center',
    includeFontPadding: false,
  },
  miniCursorLine: {
    position: 'absolute',
    bottom: 3,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
    opacity: 0.9,
  },

  // ── Texto descritivo ──
  descricaoBox: {
    backgroundColor: '#16213e',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#0f3460',
    width: '100%',
    marginBottom: 24,
  },
  descricao: {
    color: '#d0d0e0',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },

  // ── Bolinhas de passo ──
  dots: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: '#0f3460',
    borderWidth: 1,
    borderColor: '#1a3a6a',
  },
  dotActive: { backgroundColor: '#e94560', borderColor: '#e94560', width: 24 },
  dotDone:   { backgroundColor: '#4fc3f7', borderColor: '#4fc3f7' },

  // ── Barra de navegação inferior ──
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#16213e',
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    gap: 12,
  },
  btnPlaceholder: { flex: 1 },

  btnVoltar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
    alignItems: 'center',
  },
  btnVoltarText: { color: '#a0a0b0', fontSize: 14, fontWeight: '700' },

  btnAvancar: {
    flex: 2,
    backgroundColor: '#0f3460',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a4a8a',
  },
  btnAvancarLast: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
    elevation: 6,
    shadowColor: '#e94560',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  btnAvancarText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
});
