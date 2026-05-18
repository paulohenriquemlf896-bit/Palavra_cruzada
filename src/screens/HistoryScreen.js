// src/screens/HistoryScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen({ onGoHome, onContinueGame }) {
  const [savedGames, setSavedGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carrega os jogos do armazenamento local
  const loadHistory = async () => {
    try {
      setLoading(true);
      const allKeys = await AsyncStorage.getAllKeys();
      // Filtra apenas as chaves que pertencem aos jogos salvos
      const gameKeys = allKeys.filter(key => key.startsWith('cruzada_'));
      
      if (gameKeys.length === 0) {
        setSavedGames([]);
        return;
      }

      // Busca todos os dados de uma vez
      const stores = await AsyncStorage.multiGet(gameKeys);
      
      const parsedGames = stores.map(([key, value]) => {
        const data = JSON.parse(value);
        return {
          key, // Ex: "cruzada_Tecnologia_10x10"
          tema: data.tema,
          tamanho: data.tamanho,
          savedAt: new Date(data.savedAt),
        };
      });

      // Ordena do mais recente para o mais antigo
      parsedGames.sort((a, b) => b.savedAt - a.savedAt);
      setSavedGames(parsedGames);
    } catch (error) {
      console.error('[History] Erro ao carregar histórico:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico de jogos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Apaga um jogo específico
  const handleDelete = (key, tema) => {
    Alert.alert(
      'Apagar Jogo',
      `Tem certeza que deseja excluir o jogo salvo de ${tema}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(key);
            loadHistory(); // Recarrega a lista após apagar
          },
        },
      ]
    );
  };

  // Formata a data para exibir amigavelmente
  const formatDate = (date) => {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const hora = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${date.getFullYear()} às ${hora}:${min}`;
  };

  // Renderiza cada cartão de jogo salvo
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTheme}>{item.tema.toUpperCase()}</Text>
        <Text style={styles.cardSize}>{item.tamanho}</Text>
      </View>
      <Text style={styles.cardDate}>⏳ Salvo em: {formatDate(item.savedAt)}</Text>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.deleteBtn} 
          onPress={() => handleDelete(item.key, item.tema)}
        >
          <Text style={styles.deleteBtnText}>🗑 Apagar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.continueBtn} 
          onPress={() => onContinueGame({ tema: item.tema, tamanho: item.tamanho })}
        >
          <Text style={styles.continueBtnText}>▶ Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onGoHome} style={styles.topBtn}>
          <Text style={styles.topBtnTextRed}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>HISTÓRICO</Text>
        <View style={styles.spacer} />
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Carregando jogos salvos...</Text>
        </View>
      ) : savedGames.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>Nenhum jogo salvo encontrado.</Text>
          <Text style={styles.emptySubText}>Comece uma partida para salvá-la!</Text>
        </View>
      ) : (
        <FlatList
          data={savedGames}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1a1a2e' },
  
  topBar: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 14,
    backgroundColor: '#16213e', 
    borderBottomWidth: 1, 
    borderBottomColor: '#0f3460',
  },
  topBtn: { 
    paddingVertical: 6, 
    paddingHorizontal: 4, 
    width: 60 
  },
  topBtnTextRed: { 
    color: '#e94560', 
    fontWeight: '700', 
    fontSize: 14 
  },
  topTitle: { 
    color: '#fff', 
    fontWeight: '900', 
    fontSize: 16, 
    letterSpacing: 2 
  },
  spacer: { 
    width: 60 
  },

  listContent: { padding: 20 },

  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  emptyEmoji: { 
    fontSize: 48, 
    marginBottom: 12 
  },
  emptyText: { 
    color: '#e2e2e2', 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 8 
  },
  emptySubText: { 
    color: '#a0a0b0', 
    fontSize: 14 
  },

  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  cardTheme: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '900', 
    letterSpacing: 1 
  },
  cardSize: { 
    color: '#4fc3f7', 
    fontSize: 14, 
    fontWeight: '700', 
    backgroundColor: '#0f3460', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  cardDate: { 
    color: '#a0a0b0', 
    fontSize: 13, 
    marginBottom: 16 
  },
  
  cardActions: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: 12 
  },
  deleteBtn: { 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#e94560' 
  },
  deleteBtnText: { 
    color: '#e94560', 
    fontWeight: '700', 
    fontSize: 13 
  },
  continueBtn: { 
    backgroundColor: '#4fc3f7', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 8 
  },
  continueBtnText: { 
    color: '#16213e', 
    fontWeight: '800', 
    fontSize: 13 
  },
});