// src/screens/HomeScreen.js
// Versão 2.0 — Seleção de dificuldade por cards grandes + seleção de tema

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DIFICULDADES_LISTA, DIFICULDADES } from '../utils/dificuldades';

// Temas: label com acento para UI → valor sem acento para o gerador
const TEMAS = [
  { label: 'Tecnologia', valor: 'Tecnologia' },
  { label: 'Geografia',  valor: 'Geografia'  },
  { label: 'História',   valor: 'Historia'   },
  { label: 'Esportes',   valor: 'Esportes'   },
];

export default function HomeScreen({ onStartGame, onGoHistory, onGoTutorial }) {
  const [temaSelecionado,       setTemaSelecionado]       = useState(TEMAS[0].valor);
  const [dificuldadeSelecionada, setDificuldadeSelecionada] = useState(DIFICULDADES.medio.id);

  const difAtual = DIFICULDADES[dificuldadeSelecionada];

  const handleStartGame = () => {
    onStartGame({
      tema:        temaSelecionado,
      tamanho:     difAtual.tamanho,
      dificuldade: dificuldadeSelecionada,  // ← novo campo
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ── CABEÇALHO ── */}
        <View style={styles.header}>
          <Text style={styles.titleEmoji}>🧩</Text>
          <Text style={styles.title}>CRUZAPALAVRAS</Text>
          <Text style={styles.subtitle}>Teste seu vocabulário!</Text>
        </View>

        {/* ── SELEÇÃO DE DIFICULDADE ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>🎯 Dificuldade</Text>
          <View style={styles.diffRow}>
            {DIFICULDADES_LISTA.map((dif) => {
              const selected = dificuldadeSelecionada === dif.id;
              return (
                <TouchableOpacity
                  key={dif.id}
                  style={[
                    styles.diffCard,
                    selected && { borderColor: dif.cor, borderWidth: 2 },
                  ]}
                  onPress={() => setDificuldadeSelecionada(dif.id)}
                  activeOpacity={0.75}
                >
                  {/* Badge de selecionado */}
                  {selected && (
                    <View style={[styles.diffBadge, { backgroundColor: dif.cor }]}>
                      <Text style={styles.diffBadgeText}>✓</Text>
                    </View>
                  )}

                  <Text style={styles.diffEmoji}>{dif.emoji}</Text>
                  <Text style={[styles.diffLabel, selected && { color: dif.cor }]}>
                    {dif.label}
                  </Text>
                  <Text style={styles.diffDesc}>{dif.descricao}</Text>

                  {/* Detalhes do nível */}
                  <View style={styles.diffDetails}>
                    <View style={[styles.diffPill, { backgroundColor: dif.corClara }]}>
                      <Text style={[styles.diffPillText, { color: dif.corTexto }]}>
                        {dif.tamanho}
                      </Text>
                    </View>
                    <View style={[styles.diffPill, { backgroundColor: dif.corClara }]}>
                      <Text style={[styles.diffPillText, { color: dif.corTexto }]}>
                        {dif.dicas === 0 ? 'Sem dicas' : `${dif.dicas} dicas`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── SELEÇÃO DE TEMA ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>📚 Tema</Text>
          <View style={styles.optionsRow}>
            {TEMAS.map(({ label, valor }) => (
              <TouchableOpacity
                key={valor}
                style={[styles.optionButton, temaSelecionado === valor && styles.optionButtonSelected]}
                onPress={() => setTemaSelecionado(valor)}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionText, temaSelecionado === valor && styles.optionTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── RESUMO ── */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            {difAtual.emoji}{' '}
            <Text style={[styles.summaryValue, { color: difAtual.cor }]}>{difAtual.label}</Text>
            {'  ·  '}
            <Text style={styles.summaryValue}>
              {TEMAS.find(t => t.valor === temaSelecionado)?.label}
            </Text>
            {'  ·  '}
            <Text style={styles.summaryValue}>{difAtual.tamanho}</Text>
          </Text>
          {difAtual.dicas === 0 ? (
            <Text style={styles.summaryWarning}>⚠ Modo sem dicas ativado</Text>
          ) : (
            <Text style={styles.summaryHint}>💡 {difAtual.dicas} dicas disponíveis</Text>
          )}
        </View>

        {/* ── BOTÃO INICIAR ── */}
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: difAtual.cor,
            shadowColor: difAtual.cor }]}
          onPress={handleStartGame}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>
            {difAtual.emoji}  JOGAR NO {difAtual.label.toUpperCase()}
          </Text>
        </TouchableOpacity>

        {/* ── BOTÃO HISTÓRICO ── */}
        <TouchableOpacity style={styles.historyButton} onPress={onGoHistory} activeOpacity={0.85}>
          <Text style={styles.historyButtonText}>🕒 VER HISTÓRICO</Text>
        </TouchableOpacity>

        {/* ── BOTÃO TUTORIAL ── */}
        <TouchableOpacity style={styles.tutorialButton} onPress={onGoTutorial} activeOpacity={0.85}>
          <Text style={styles.tutorialButtonText}>❓ COMO JOGAR</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: '#1a1a2e' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 30 },

  // ── Cabeçalho ──
  header:      { alignItems: 'center', paddingTop: 36, paddingBottom: 24 },
  titleEmoji:  { fontSize: 52, marginBottom: 6 },
  title: {
    fontSize: 32, fontWeight: '900', color: '#e94560',
    letterSpacing: 4, textAlign: 'center',
  },
  subtitle: { fontSize: 14, color: '#a0a0b0', marginTop: 6, letterSpacing: 1 },

  // ── Cards de seção ──
  sectionCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: '#0f3460',
  },
  sectionLabel: {
    fontSize: 14, fontWeight: '700', color: '#e2e2e2',
    marginBottom: 14, letterSpacing: 0.5,
  },

  // ── Cards de dificuldade ──
  diffRow: { flexDirection: 'row', gap: 10 },
  diffCard: {
    flex: 1,
    backgroundColor: '#0f1f3d',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1a3a6a',
    position: 'relative',
    alignItems: 'center',
  },
  diffBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  diffBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  diffEmoji:  { fontSize: 22, marginBottom: 4 },
  diffLabel: {
    fontSize: 14, fontWeight: '900', color: '#e2e2e2',
    marginBottom: 4, textAlign: 'center',
  },
  diffDesc: {
    fontSize: 10, color: '#7a8aaa', textAlign: 'center',
    lineHeight: 14, marginBottom: 8,
  },
  diffDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  diffPill: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  diffPillText: { fontSize: 10, fontWeight: '700' },

  // ── Botões de tema ──
  optionsRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: {
    paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#0f3460', backgroundColor: '#0f3460',
  },
  optionButtonSelected: { backgroundColor: '#e94560', borderColor: '#e94560' },
  optionText:           { color: '#a0a0b0', fontWeight: '600', fontSize: 13 },
  optionTextSelected:   { color: '#ffffff' },

  // ── Resumo ──
  summaryBox: {
    backgroundColor: '#0f1f3d', borderRadius: 12, padding: 14,
    marginBottom: 18, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#1a3a6a',
  },
  summaryText:    { color: '#a0a0b0', fontSize: 13 },
  summaryValue:   { color: '#e2e2e2', fontWeight: '700' },
  summaryWarning: { color: '#e94560', fontSize: 12, fontWeight: '600' },
  summaryHint:    { color: '#f5c518', fontSize: 12, fontWeight: '600' },

  // ── Botão iniciar ──
  startButton: {
    borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', marginBottom: 0,
    shadowOpacity: 0.45, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  startButtonText: {
    color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 1.5,
  },

  // ── Botões secundários ──
  historyButton: {
    backgroundColor: '#0f3460', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 10,
    borderWidth: 1, borderColor: '#164a80',
  },
  historyButtonText: { color: '#4fc3f7', fontSize: 15, fontWeight: '800', letterSpacing: 1.5 },
  tutorialButton: {
    backgroundColor: 'transparent', borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', marginTop: 6,
    borderWidth: 1, borderColor: '#2a2a4a',
  },
  tutorialButtonText: { color: '#666688', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
});