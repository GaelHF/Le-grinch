import React, { useState, useEffect } from 'react';
import { Users, Trophy, Eye, Plus, Trash2 } from 'lucide-react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

socket.on('connect', () => {
  console.log('Socket connecté !');
});

socket.on('connect_error', (error) => {
  console.error('Erreur de connexion Socket:', error);
});

export default function JeuTricheur() {
  const [screen, setScreen] = useState('home');
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [cheater, setCheater] = useState('');

  useEffect(() => {
    socket.on('playersUpdate', (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on('gameStarted', () => {
      setScreen('game');
    });

    socket.on('questionUpdate', ({ question, answer, cheater }) => {
      setCurrentQuestion(question);
      setCurrentAnswer(answer);
      setCheater(cheater);
    });

    return () => {
      socket.off('playersUpdate');
      socket.off('gameStarted');
      socket.off('questionUpdate');
    };
  }, []);

  const createGame = () => {
    socket.emit('createGame', (response) => {
      if (response.success) {
        setGameCode(response.code);
        setCurrentGame(response.code);
        setIsAdmin(true);
        setScreen('lobby');
      }
    });
  };

  const joinGame = () => {
    if (!gameCode || !playerName) {
      alert('Veuillez entrer un code et un nom');
      return;
    }
    socket.emit('joinGame', { code: gameCode.toUpperCase(), playerName }, (response) => {
      if (response.success) {
        setPlayers(response.players);
        setCurrentGame(gameCode.toUpperCase());
        setIsAdmin(false);
        setScreen('lobby');
      } else {
        alert(response.message);
      }
    });
  };

  const startGame = () => {
    socket.emit('startGame', { code: currentGame });
  };

  const askQuestion = () => {
    if (!currentQuestion || !currentAnswer || !cheater) {
      alert('Veuillez remplir tous les champs et choisir un tricheur');
      return;
    }
    socket.emit('askQuestion', {
      code: currentGame,
      question: currentQuestion,
      answer: currentAnswer,
      cheater: cheater
    });
  };

  const clearQuestion = () => {
    socket.emit('clearQuestion', { code: currentGame });
    setCurrentQuestion('');
    setCurrentAnswer('');
    setCheater('');
  };

  const givePoints = (playerName, points) => {
    socket.emit('givePoints', { code: currentGame, playerName, points });
  };

  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
              <Eye className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Jeu du Tricheur</h1>
            <p className="text-gray-600">Un joueur voit la réponse secrètement...</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={createGame}
              className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Créer une partie
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>

            <input
              type="text"
              placeholder="Code de la partie"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none text-center text-xl font-mono"
              maxLength={6}
            />

            <input
              type="text"
              placeholder="Votre nom"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
            />

            <button
              onClick={joinGame}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Rejoindre la partie
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Lobby</h2>
              <div className="inline-block bg-purple-100 px-6 py-3 rounded-xl">
                <p className="text-sm text-gray-600">Code de la partie</p>
                <p className="text-3xl font-mono font-bold text-purple-600">{currentGame}</p>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-semibold">Joueurs ({players.length})</h3>
              </div>
              <div className="space-y-2">
                {players.map((player, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{player.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={startGame}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition"
              >
                Démarrer la partie
              </button>
            )}

            {!isAdmin && (
              <p className="text-center text-gray-600">En attente du démarrage...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'game') {
    if (isAdmin) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 mb-4">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Interface Gestionnaire</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                <input
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="Entrez votre question..."
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Réponse</label>
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="La réponse secrète..."
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Qui est le tricheur ?</label>
                <select
                  value={cheater}
                  onChange={(e) => setCheater(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Choisir un tricheur...</option>
                  {players.map((player, idx) => (
                    <option key={idx} value={player.name}>{player.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={askQuestion}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
                >
                  Afficher la question
                </button>
                <button
                  onClick={clearQuestion}
                  className="px-6 bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-400 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-6 h-6 text-yellow-600" />
                <h3 className="text-2xl font-bold text-gray-800">Classement</h3>
              </div>
              <div className="space-y-3">
                {sortedPlayers.map((player, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-purple-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="font-medium text-lg">{player.name}</span>
                      <span className="text-2xl font-bold text-purple-600">{player.points}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => givePoints(player.name, 1)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => givePoints(player.name, 3)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                      >
                        +3
                      </button>
                      <button
                        onClick={() => givePoints(player.name, -1)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                      >
                        -1
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      const isCheater = cheater === playerName;
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 mb-4">
              {currentQuestion ? (
                <>
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Question</h2>
                  <div className="bg-purple-50 p-6 rounded-xl mb-6">
                    <p className="text-2xl text-center font-medium text-gray-800">{currentQuestion}</p>
                  </div>
                  {isCheater && currentAnswer && (
                    <div className="bg-green-50 border-2 border-green-500 p-6 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-6 h-6 text-green-600" />
                        <p className="text-green-800 font-bold">Tu es le tricheur !</p>
                      </div>
                      <p className="text-xl text-green-900 font-medium">Réponse : {currentAnswer}</p>
                    </div>
                  )}
                  {!isCheater && (
                    <p className="text-center text-gray-500">Trouve la réponse ou cherche le tricheur...</p>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 text-xl">En attente d'une question...</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-6 h-6 text-yellow-600" />
                <h3 className="text-2xl font-bold text-gray-800">Classement</h3>
              </div>
              <div className="space-y-3">
                {sortedPlayers.map((player, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-purple-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="font-medium flex-1">{player.name}</span>
                    <span className="text-2xl font-bold text-purple-600">{player.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return null;
}