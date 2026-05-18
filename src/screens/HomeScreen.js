// src/screens/HomeScreen.js
// Tela inicial: permite ao usuário escolher o tema e o tamanho do tabuleiro

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Temas: chaves exatas do BANCO em CrosswordGenerator.js
// Label com acento para exibição → valor sem acento para o gerador
const TEMAS = [
  { label: 'Tecnologia', valor: 'Tecnologia' },
  { label: 'Geografia',  valor: 'Geografia'  },
  { label: 'História',   valor: 'Historia'   },
  { label: 'Esportes',   valor: 'Esportes'   },
];
const TAMANHOS = ['8x8', '10x10', '12x12'];

export default function HomeScreen({ onStartGame, onGoHistory }) {
  // Estado local para as seleções do usuário
  const [temaSelecionado, setTemaSelecionado] = useState(TEMAS[0].valor);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState('10x10');

  const handleStartGame = () => {
    // Passa a configuração escolhida para o App.js via prop
    onStartGame({
      tema: temaSelecionado,
      tamanho: tamanhoSelecionado,
    });
  };

  return (
    // SafeAreaView com edges específicos para proteger apenas o topo e a base
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ── CABEÇALHO ── */}
        <View style={styles.header}>
          <Text style={styles.titleEmoji}>🧩</Text>
          <Text style={styles.title}>CRUZAPALAVRAS</Text>
          <Text style={styles.subtitle}>Teste seu vocabulário!</Text>
        </View>

        {/* ── SELEÇÃO DE TEMA ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>📚 Escolha o Tema</Text>
          <View style={styles.optionsRow}>
            {TEMAS.map(({ label, valor }) => (
              <TouchableOpacity
                key={valor}
                style={[
                  styles.optionButton,
                  temaSelecionado === valor && styles.optionButtonSelected,
                ]}
                onPress={() => setTemaSelecionado(valor)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    temaSelecionado === valor && styles.optionTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── SELEÇÃO DE TAMANHO ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>📐 Tamanho do Tabuleiro</Text>
          <View style={styles.optionsRow}>
            {TAMANHOS.map((tamanho) => (
              <TouchableOpacity
                key={tamanho}
                style={[
                  styles.optionButton,
                  styles.optionButtonWide,
                  tamanhoSelecionado === tamanho && styles.optionButtonSelected,
                ]}
                onPress={() => setTamanhoSelecionado(tamanho)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    tamanhoSelecionado === tamanho && styles.optionTextSelected,
                  ]}
                >
                  {tamanho}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── RESUMO DA SELEÇÃO ── */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            Tema: <Text style={styles.summaryValue}>{TEMAS.find(t => t.valor === temaSelecionado)?.label ?? temaSelecionado}</Text>
            {'   '}
            Tabuleiro: <Text style={styles.summaryValue}>{tamanhoSelecionado}</Text>
          </Text>
        </View>

        {/* ── BOTÃO INICIAR ── */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartGame}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>🔤 GERAR CRUZADA</Text>
        </TouchableOpacity>

        {/* ── BOTÃO HISTÓRICO ── */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={onGoHistory}
          activeOpacity={0.85}
        >
          <Text style={styles.historyButtonText}>🕒 VER HISTÓRICO</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // ── Cabeçalho ──
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  titleEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#e94560',
    letterSpacing: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0b0',
    marginTop: 8,
    letterSpacing: 1,
  },

  // ── Cards de seção ──
  sectionCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e2e2',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0f3460',
    backgroundColor: '#0f3460',
  },
  optionButtonWide: {
    paddingHorizontal: 24,
  },
  optionButtonSelected: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  optionText: {
    color: '#a0a0b0',
    fontWeight: '600',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#ffffff',
  },

  // ── Resumo ──
  summaryBox: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryText: {
    color: '#a0a0b0',
    fontSize: 14,
  },
  summaryValue: {
    color: '#e94560',
    fontWeight: '700',
  },

  // ── Botões ──
  startButton: {
    backgroundColor: '#e94560',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#e94560',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  historyButton: {
    backgroundColor: '#0f3460',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12, 
    borderWidth: 1,
    borderColor: '#164a80',
  },
  historyButtonText: {
    color: '#4fc3f7',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});