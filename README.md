# 🧩 CruzaPalavras — Jogo de Palavras Cruzadas em Expo

## Estrutura de Arquivos

```
CrosswordApp/
├── App.js                          ← Ponto de entrada, gerencia navegação
├── package.json
└── src/
    ├── screens/
    │   ├── HomeScreen.js           ← Tela de configuração (tema + tamanho)
    │   └── GameScreen.js           ← Tela do jogo (estado principal)
    ├── components/
    │   └── CrosswordGrid.js        ← Renderização do tabuleiro (grid)
    └── utils/
        └── crosswordData.js        ← Função mock `gerarCruzada(tema, tamanho)`
```

## Como Rodar

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar o Expo
```bash
npx expo start
```

### 3. Abrir no dispositivo
- Escaneie o QR Code com o **Expo Go** (Android/iOS)
- Ou pressione `a` para abrir no emulador Android

## Dependências Necessárias

```bash
npx expo install react-native-safe-area-context
```

## Como a Geração do Grid Funciona

A função `gerarCruzada(tema, tamanho)` em `src/utils/crosswordData.js` retorna:

```javascript
{
  grid: [   // Matriz 2D (NxN)
    [
      { letter: 'R', isBlack: false, wordIds: [1, 5], clueNumber: 1 },
      { letter: 'E', isBlack: false, wordIds: [1],    clueNumber: null },
      { letter: null, isBlack: true, wordIds: [],     clueNumber: null },
      // ...
    ],
    // ...mais linhas
  ],
  clues: {
    across: [
      { id: 1, number: 1, clue: "Biblioteca JS para UI", row: 0, col: 0, length: 5 },
      // ...
    ],
    down: [
      { id: 5, number: 5, clue: "Conjunto de dispositivos", row: 0, col: 0, length: 4 },
      // ...
    ]
  }
}
```

## Próximos Passos (Para Evoluir o Projeto)

1. **Algoritmo real de geração**: Substituir `gerarCruzada()` por um algoritmo de backtracking
2. **Integração com IA**: Chamar a API do Claude para gerar pistas dinamicamente
3. **Persistência**: Usar `AsyncStorage` para salvar o progresso
4. **Animações**: Adicionar `react-native-reanimated` para transições suaves
5. **Múltiplos níveis**: Sistema de dificuldade (fácil/médio/difícil)
6. **Timer**: Cronômetro para medir o tempo de conclusão
