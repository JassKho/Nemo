const express = require('express');
const http = require('http'); 
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app); 
const io = new Server(server, { cors: { origin: "*" } }); 

let mysteryNumber = Math.floor(100000 + Math.random() * 900000); 
let players = [];

app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({ message: "Le serveur fonctionne !" });
});

io.on('connection', (socket) => {
  console.log(`Joueur connecté : ${socket.id}`);

  players.push(socket.id);

  socket.on('guess', (data) => {
    console.log(`Tentative : ${data.number} par ${socket.id}`);
    if (data.number == mysteryNumber) {
      io.emit('winner', { winner: socket.id, number: mysteryNumber });
      mysteryNumber = Math.floor(100000 + Math.random() * 900000);
    } else {
      const hint = data.number > mysteryNumber ? "lower" : "higher";
      socket.emit('hint', { hint });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Joueur déconnecté : ${socket.id}`);
    players = players.filter((player) => player !== socket.id);
  });
});

const PORT = 5001;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
