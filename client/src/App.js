import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io("http://localhost:5000");

function App() {
  const [gameId, setGameId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("");
  const [winner, setWinner] = useState(null);
  const [isInGame, setIsInGame] = useState(false);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    socket.on('hint', (data) => {
      setFeedback(`Essayez un nombre ${data.hint}.`);
    });

    socket.on('winner', (data) => {
      setWinner(`Le joueur ${data.winner} a trouvé le nombre mystère ${data.number} en ${data.attempts} tentatives !`);
    });

    socket.on('player-joined', ({ playerName }) => {
      alert(`${playerName} a rejoint la partie.`);
    });

    return () => {
      socket.off('hint');
      socket.off('winner');
      socket.off('player-joined');
    };
  }, []);

  const createGame = async () => {
    const response = await axios.post('http://localhost:5000/api/create-game');
    setGameId(response.data.gameId);
    setIsInGame(true);
  };

  const joinGame = async () => {
    const response = await axios.post('http://localhost:5000/api/join-game', { gameId });
    if (response.status === 200) {
      socket.emit('join-game', { gameId, playerName });
      setIsInGame(true);
    } else {
      alert(response.data.message);
    }
  };

  const handleGuess = () => {
    socket.emit('guess', { gameId, number: parseInt(guess, 10) });
    setAttempts([...attempts, guess]);
    setGuess("");
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Numerous</h1>
      {!isInGame ? (
        <>
          <div>
            <button onClick={createGame}>Créer une Partie</button>
            <input
              type="text"
              placeholder="ID de la partie"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
            <button onClick={joinGame}>Rejoindre une Partie</button>
          </div>
          <input
            type="text"
            placeholder="Votre pseudo"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
        </>
      ) : (
        <>
          <h2>ID de la partie : {gameId}</h2>
          {winner ? (
            <h2>{winner}</h2>
          ) : (
            <>
              <p>{feedback}</p>
              <input
                type="number"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Entrez un nombre"
              />
              <button onClick={handleGuess}>Soumettre</button>
              <p>Tentatives : {attempts.join(", ")}</p>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;
