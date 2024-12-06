const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let games = {}; // Stocke les parties avec leurs informations

app.use(cors());
app.use(express.json());

// API pour créer une nouvelle partie
app.post('/api/create-game', (req, res) => {
  const gameId = Math.random().toString(36).substr(2, 9);
  const mysteryNumber = Math.floor(100000 + Math.random() * 900000);

  games[gameId] = {
    mysteryNumber,
    players: {},
  };

  res.json({ gameId, message: "Partie créée avec succès !" });
});

// API pour rejoindre une partie
app.post('/api/join-game', (req, res) => {
  const { gameId } = req.body;

  if (games[gameId]) {
    res.json({ message: "Rejoint avec succès !", gameId });
  } else {
    res.status(404).json({ message: "Partie introuvable." });
  }
});

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log(`Joueur connecté : ${socket.id}`);

  // Rejoindre une partie
  socket.on('join-game', ({ gameId, playerName }) => {
    if (games[gameId]) {
      socket.join(gameId);
      games[gameId].players[socket.id] = { name: playerName, attempts: [] };

      // Informer les autres joueurs
      io.to(gameId).emit('player-joined', { playerName });
      console.log(`Joueur ${playerName} a rejoint la partie ${gameId}`);
    } else {
      socket.emit('error', { message: "Partie introuvable." });
    }
  });

  // Tentative d'un joueur
  socket.on('guess', ({ gameId, number }) => {
    const game = games[gameId];
    if (game) {
      const player = game.players[socket.id];
      if (player) {
        player.attempts.push(number);

        console.log(`Joueur ${player.name} a tenté ${number} dans la partie ${gameId}`);

        if (number == game.mysteryNumber) {
          io.to(gameId).emit('winner', {
            winner: player.name,
            attempts: player.attempts.length,
            number: game.mysteryNumber,
          });

          // Réinitialiser le nombre mystère
          game.mysteryNumber = Math.floor(100000 + Math.random() * 900000);
        } else {
          const hint = number > game.mysteryNumber ? "lower" : "higher";
          socket.emit('hint', { hint });
        }
      } else {
        socket.emit('error', { message: "Vous n'êtes pas inscrit dans cette partie." });
      }
    } else {
      socket.emit('error', { message: "Partie introuvable." });
    }
  });

  // Déconnexion d'un joueur
  socket.on('disconnect', () => {
    console.log(`Joueur déconnecté : ${socket.id}`);
    for (const gameId in games) {
      const game = games[gameId];
      if (game.players[socket.id]) {
        const playerName = game.players[socket.id].name;
        delete game.players[socket.id];
        io.to(gameId).emit('player-left', { playerName });
      }
    }
  });
});

const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
