import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io("http://localhost:5000");

function App() {
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState("");
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    socket.on('hint', (data) => {
      setFeedback(`Essayez un nombre ${data.hint}.`);
    });

    socket.on('winner', (data) => {
      setWinner(`Le joueur ${data.winner} a trouvé le nombre mystère : ${data.number}!`);
    });

    return () => {
      socket.off('hint');
      socket.off('winner');
    };
  }, []);

  const handleGuess = () => {
    socket.emit('guess', { number: parseInt(guess, 10) });
    setGuess("");
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Numerous</h1>
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
        </>
      )}
    </div>
  );
}

export default App;
