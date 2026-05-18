// App.js
// Roteador principal — agora com 4 telas: home, tutorial, game, history.
// Na primeira abertura do app, o usuário é direcionado para o tutorial.
// Nas próximas, vai direto para a HomeScreen.

import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen    from './src/screens/HomeScreen';
import GameScreen    from './src/screens/GameScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import TutorialScreen, { TUTORIAL_KEY } from './src/screens/TutorialScreen';

export default function App() {
  // 'loading' enquanto verifica AsyncStorage → sem flash de tela errada
  const [currentScreen, setCurrentScreen] = useState('loading');
  const [gameConfig,    setGameConfig]    = useState(null);

  // ── Verifica se é a primeira vez do usuário ───────────────────────────────
  // Ao montar, lê o AsyncStorage. Se não tiver a chave do tutorial,
  // exibe o tutorial. Caso contrário, vai direto para a home.
  useEffect(() => {
    AsyncStorage.getItem(TUTORIAL_KEY).then(value => {
      setCurrentScreen(value === 'done' ? 'home' : 'tutorial');
    }).catch(() => {
      setCurrentScreen('home'); // falha silenciosa → vai para home
    });
  }, []);

  // ── Handlers de navegação ─────────────────────────────────────────────────
  const handleTutorialFinish = () => setCurrentScreen('home');

  const handleStartGame = (config) => {
    setGameConfig(config);
    setCurrentScreen('game');
  };

  const handleGoHome = () => {
    setGameConfig(null);
    setCurrentScreen('home');
  };

  const handleGoHistory = () => setCurrentScreen('history');

  const handleContinueGame = (config) => {
    setGameConfig(config);
    setCurrentScreen('game');
  };

  // Navega para o tutorial a partir da HomeScreen (botão "Como jogar")
  const handleGoTutorial = () => setCurrentScreen('tutorial');

  // ── Render ────────────────────────────────────────────────────────────────
  // 'loading' não renderiza nada → evita piscar a tela errada enquanto lê storage
  if (currentScreen === 'loading') return null;

  return (
    <SafeAreaProvider>
      {currentScreen === 'tutorial' ? (
        <TutorialScreen onFinish={handleTutorialFinish} />
      ) : currentScreen === 'home' ? (
        <HomeScreen
          onStartGame={handleStartGame}
          onGoHistory={handleGoHistory}
          onGoTutorial={handleGoTutorial}
        />
      ) : currentScreen === 'game' ? (
        <GameScreen config={gameConfig} onGoHome={handleGoHome} />
      ) : (
        <HistoryScreen onGoHome={handleGoHome} onContinueGame={handleContinueGame} />
      )}
    </SafeAreaProvider>
  );
}