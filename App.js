// App.js - Ponto de entrada principal do aplicativo
// Configura o provedor de Safe Area e o sistema de navegação entre telas

import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';

export default function App() {
  // Controla qual tela está sendo exibida: 'home' ou 'game'
  const [currentScreen, setCurrentScreen] = useState('home');

  // Armazena as configurações escolhidas pelo usuário na tela inicial
  const [gameConfig, setGameConfig] = useState(null);

  // Função chamada ao pressionar "Gerar Cruzada" na HomeScreen
  const handleStartGame = (config) => {
    setGameConfig(config); // salva tema e tamanho
    setCurrentScreen('game'); // navega para o jogo
  };

  // Função para voltar à tela inicial (ex: botão "Novo Jogo")
  const handleGoHome = () => {
    setGameConfig(null);
    setCurrentScreen('home');
  };

  return (
    // SafeAreaProvider garante que o conteúdo não fique sob o notch/barra de status
    <SafeAreaProvider>
      {currentScreen === 'home' ? (
        <HomeScreen onStartGame={handleStartGame} />
      ) : (
        <GameScreen config={gameConfig} onGoHome={handleGoHome} />
      )}
    </SafeAreaProvider>
  );
}