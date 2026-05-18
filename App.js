// App.js
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import HistoryScreen from './src/screens/HistoryScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [gameConfig, setGameConfig] = useState(null);

  const handleStartGame = (config) => {
    setGameConfig(config);
    setCurrentScreen('game');
  };

  const handleGoHome = () => {
    setGameConfig(null);
    setCurrentScreen('home');
  };

  const handleGoHistory = () => {
    setCurrentScreen('history');
  };

  const handleContinueGame = (config) => {
    setGameConfig(config);
    setCurrentScreen('game');
  };

  // Usando ternários para garantir que nenhum texto/booleano vaze
  return (
    <SafeAreaProvider>
      {currentScreen === 'home' ? (
        <HomeScreen onStartGame={handleStartGame} onGoHistory={handleGoHistory} />
      ) : currentScreen === 'game' ? (
        <GameScreen config={gameConfig} onGoHome={handleGoHome} />
      ) : (
        <HistoryScreen onGoHome={handleGoHome} onContinueGame={handleContinueGame} />
      )}
    </SafeAreaProvider>
  );
}