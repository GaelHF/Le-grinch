const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",  // Accepte toutes les origines
    methods: ["GET", "POST"]
  }
});

const games = {};

io.on('connection', (socket) => {
  console.log('Nouveau joueur connecté:', socket.id);

  socket.on('createGame', (callback) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    games[code] = {
      code,
      players: [],
      currentQuestion: '',
      currentAnswer: '',
      cheater: '',
      adminSocket: socket.id
    };
    socket.join(code);
    callback({ success: true, code });
    console.log('Partie créée:', code);
  });

  socket.on('joinGame', ({ code, playerName }, callback) => {
    const game = games[code];
    if (!game) {
      callback({ success: false, message: 'Partie introuvable' });
      return;
    }
    
    if (!game.players.find(p => p.name === playerName)) {
      game.players.push({ name: playerName, points: 0 });
    }
    
    socket.join(code);
    io.to(code).emit('playersUpdate', game.players);
    callback({ success: true, players: game.players });
    console.log(`${playerName} a rejoint la partie ${code}`);
  });

  socket.on('leaveGame', ({ code, playerName }) => {
    const game = games[code];
    if (!game) return;

    game.players = game.players.filter(p => p.name !== playerName);
    socket.leave(code);

    // Si l’admin quitte → fermer la partie
    if (socket.id === game.adminSocket) {
      io.to(code).emit('gameClosed');
      delete games[code];
      console.log(`Partie ${code} fermée (admin parti)`);
      return;
    }

    io.to(code).emit('playersUpdate', game.players);
    console.log(`${playerName} a quitté la partie ${code}`);
  });

  socket.on('startGame', ({ code }) => {
    io.to(code).emit('gameStarted');
    console.log('Partie démarrée:', code);
  });

  socket.on('askQuestion', ({ code, question, answer, cheater }) => {
    const game = games[code];
    if (game) {
      game.currentQuestion = question;
      game.currentAnswer = answer;
      game.cheater = cheater;
      io.to(code).emit('questionUpdate', { question, answer, cheater });
      console.log('Question envoyée:', question);
    }
  });

  socket.on('clearQuestion', ({ code }) => {
    const game = games[code];
    if (game) {
      game.currentQuestion = '';
      game.currentAnswer = '';
      game.cheater = '';
      io.to(code).emit('questionUpdate', { question: '', answer: '', cheater: '' });
      console.log('Question effacée');
    }
  });

  socket.on('givePoints', ({ code, playerName, points }) => {
    const game = games[code];
    if (game) {
      const player = game.players.find(p => p.name === playerName);
      if (player) {
        player.points += points;
        io.to(code).emit('playersUpdate', game.players);
        console.log(`${points} points donnés à ${playerName}`);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Joueur déconnecté:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Serveur Socket.IO lancé sur le port ${PORT}`);
  console.log(`✓ Prêt à recevoir des connexions!`);
});