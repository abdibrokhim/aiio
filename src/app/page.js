// pages/index.js
'use client'

import React, { useState, useEffect } from 'react';
import { useSocket } from './contexts/SocketContext';

export default function Home() {
  // --- State Variables ---
  const [prompt, setPrompt] = useState('');
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [evaluationError, setEvaluationError] = useState(null);

  const [soundText, setSoundText] = useState('');
  const [audioSrc, setAudioSrc] = useState(null);
  const [soundLoading, setSoundLoading] = useState(false);
  const [soundError, setSoundError] = useState(null);

  const [imagePrompt, setImagePrompt] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(null);

  // --- State Variables for Multiplayer ---
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [players, setPlayers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [role, setRole] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');

  // --- Basic User State ---
  const [userGuess, setUserGuess] = useState('');
  const [score, setScore] = useState(null);

  const [userAudioGuess, setUserAudioGuess] = useState('');
  const [audioScore, setAudioScore] = useState(null);

  const socket = useSocket();

  const [socketId, setSocketId] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);

  const [imageQuestion, setImageQuestion] = useState('');
  const [audioQuestion, setAudioQuestion] = useState('');

  const [superQuestion, setSuperQuestion] = useState('');
  const [superAudioQuestion, setSuperAudioQuestion] = useState('');

  const [currentAudioPrompt, setCurrentAudioPrompt] = useState('');

  // --- Multiplayer Handlers ---
  useEffect(() => {
    if (!socket) return;

    // Listen for player updates
    socket.on('updatePlayers', (players) => {
      setPlayers(players);
    });

    // Listen for new chat messages
    socket.on('newChatMessage', ({ message, username }) => {
      setChatMessages((prev) => [...prev, { message, username }]);
    });

    // Listen for roles assigned
    socket.on('rolesAssigned', ({ role }) => {
      setRole(role);
    });

    // Listen for image generated
    socket.on('imageGenerated', ({ imageUrl }) => {
      setImageUrl(imageUrl);
    });

    // Listen for sound generated
    socket.on('soundGenerated', ({ audioSrc }) => {
      setAudioSrc(audioSrc);
    });

    // Basic user listens for evaluation result
    socket.on('evaluationResult', ({ grade }) => {
      setScore(grade);
    });

    socket.on('evaluationAudioResult', ({ grade }) => {
      setAudioScore(grade);
    });

    // Listen for image question
    socket.on('imageQuestion', ({ imageUrl, question }) => {
      setImageUrl(imageUrl);
      setImageQuestion(question);
    });

    // Listen for audio question
    socket.on('audioQuestion', ({ audioSrc, question }) => {
      setAudioSrc(audioSrc);
      setAudioQuestion(question);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('updatePlayers');
      socket.off('newChatMessage');
      socket.off('rolesAssigned');
      socket.off('imageGenerated');
      socket.off('soundGenerated');
      socket.off('evaluationResult');
      socket.off('evaluationAudioResult');
      socket.off('imageQuestion');
      socket.off('audioQuestion');
    };
  }, [socket]);

  // Super user listens for guess submission
  useEffect(() => {
    if (!socket || role !== 'super') return;

    socket.on('submitGuess', async ({ guess, socketId }) => {
      // Super user performs evaluation
      try {
        const response = await fetch('/api/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: currentPrompt.trim(),
            userA: guess.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(data.error?.message || 'An error occurred.');
        } else {
          const grade = data.grades[0];

          // Send back the score to the basic user via server
          socket.emit('evaluationResult', { grade, targetSocketId: socketId });
        }
      } catch (err) {
        console.error('Failed to connect to the server.');
      }
    });

    socket.on('submitAudioGuess', async ({ guess, socketId }) => {
      // Super user performs evaluation
      try {
        const response = await fetch('/api/evaluate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: currentAudioPrompt.trim(),
            userA: guess.trim(),
            userB: '',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(data.error?.message || 'An error occurred.');
        } else {
          const grade = data.grades[0];

          // Send back the score to the basic user via server
          socket.emit('evaluationAudioResult', { grade, targetSocketId: socketId });
        }
      } catch (err) {
        console.error('Failed to connect to the server.');
      }
    });

    return () => {
      socket.off('submitGuess');
      socket.off('submitAudioGuess');
    };
  }, [socket, role, currentPrompt, currentAudioPrompt]);

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (username.trim() && roomId.trim()) {
      socket.emit('joinRoom', { roomId, username });
      setIsConnected(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      socket.emit('chatMessage', { roomId, message: chatInput.trim(), username });
      setChatInput('');
    }
  };

  // --- Handler for generating images (Super User) ---
  const handleGenerateImage = async (e) => {
    e.preventDefault();
    setImageLoading(true);
    setImageError('');
    setImageUrl(null);

    if (!imagePrompt.trim()) {
      setImageError("The 'Image Prompt' field is required.");
      setImageLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/generateImage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setImageError(data.error?.message || 'An error occurred.');
      } else {
        setImageUrl(data.imageUrl);
        setCurrentPrompt(imagePrompt.trim());

        // Emit image generated event
        socket.emit('imageGenerated', { imageUrl: data.imageUrl });
      }
    } catch (err) {
      setImageError('Failed to connect to the server.');
    } finally {
      setImageLoading(false);
    }
  };

  // --- Handler for submitting image question (Super User) ---
  const handleSubmitImageQuestion = (e) => {
    e.preventDefault();

    if (!superQuestion.trim()) {
      // Handle error if necessary
      return;
    }

    // Emit event to send image and question to basic users
    socket.emit('imageQuestion', { imageUrl, question: superQuestion });

    // Clear the question input
    setSuperQuestion(superQuestion);
  };

  // --- Handler for submitting guess (Basic User) ---
  const handleSubmitGuess = (e) => {
    e.preventDefault();
    if (userGuess.trim()) {
      // Emit submit guess event with socketId
      socket.emit('submitGuess', { guess: userGuess, socketId: socket.id, roomId });
      setUserGuess('');
    }
  };

  // --- Handler for generating sound effects (Super User) ---
  const handleGenerateSound = async (e) => {
    e.preventDefault();
    setSoundLoading(true);
    setSoundError('');
    setAudioSrc(null);

    if (!soundText.trim()) {
      setSoundError("The 'Text Description' field is required.");
      setSoundLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/generateAudio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: soundText.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSoundError(data.error?.message || 'An error occurred.');
      } else {
        // Create a Blob from the base64 string
        const audioBlob = new Blob([Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))], {
          type: 'audio/mpeg',
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioSrc(audioUrl);
        setCurrentAudioPrompt(soundText.trim());

        // Emit sound generated event
        socket.emit('soundGenerated', { audioSrc: audioUrl });
      }
    } catch (err) {
      setSoundError('Failed to connect to the server.');
    } finally {
      setSoundLoading(false);
    }
  };

  // --- Handler for submitting audio question (Super User) ---
  const handleSubmitAudioQuestion = (e) => {
    e.preventDefault();

    if (!superAudioQuestion.trim()) {
      // Handle error if necessary
      return;
    }

    // Emit event to send audio and question to basic users
    socket.emit('audioQuestion', { audioSrc, question: superAudioQuestion });

    // Clear the question input
    setSuperAudioQuestion(superAudioQuestion);
  };

  // --- Handler for submitting audio guess (Basic User) ---
  const handleSubmitGuessAudio = (e) => {
    e.preventDefault();
    if (userAudioGuess.trim()) {
      // Emit submit guess event with socketId
      socket.emit('submitAudioGuess', { guess: userAudioGuess, socketId: socket.id, roomId });
      setUserAudioGuess('');
    }
  };

  // --- Save data to local storage ---
  useEffect(() => {
    if (imageUrl) {
      localStorage.setItem('imageUrl', imageUrl);
    }
  }, [imageUrl]);

  useEffect(() => {
    if (score !== null) {
      localStorage.setItem('score', score.toString());
    }
  }, [score]);

  useEffect(() => {
    if (audioSrc) {
      localStorage.setItem('audioSrc', audioSrc);
    }
  }, [audioSrc]);

  // --- Load data from local storage on mount ---
  useEffect(() => {
    const savedImageUrl = localStorage.getItem('imageUrl');
    if (savedImageUrl) {
      setImageUrl(savedImageUrl);
    }

    const savedScore = localStorage.getItem('score');
    if (savedScore !== null) {
      setScore(Number(savedScore));
    }

    const savedAudioSrc = localStorage.getItem('audioSrc');
    if (savedAudioSrc) {
      setAudioSrc(savedAudioSrc);
    }
  }, []);

  // Get socket ID
  useEffect(() => {
    if (socket) {
      setSocketId(socket.id);
    }
  }, [socket]);

  // Update currentPlayer when players list changes
  useEffect(() => {
    if (players.length > 0 && socketId) {
      const player = players.find((p) => p.socketId === socketId);
      setCurrentPlayer(player);
    }
  }, [players, socketId]);

  useEffect(() => {
    console.log('number of players: ', players.length);
    console.log('roles: ', role);
  }, [players]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <main className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Harmony Quest Game</h1>

        {/* --- Multiplayer Section --- */}
        {!isConnected ? (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Join a Game Room</h2>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your username..."
                  required
                />
              </div>

              <div>
                <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
                  Room ID
                </label>
                <input
                  type="text"
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter or create a room ID..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Join Room
              </button>
            </form>
          </section>
        ) : (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Game Room: {roomId}</h2>
            <div className="flex space-x-4">
              {/* Player List */}
              <div className="w-1/3">
                <h3 className="text-lg font-semibold mb-2">Players</h3>
                <ul className="list-disc list-inside">
                  {players.map((player) => (
                    <li key={player.socketId}>{player.username}</li>
                  ))}
                </ul>
              </div>

              {/* Chat Box */}
              <div className="w-2/3">
                <h3 className="text-lg font-semibold mb-2">Chat</h3>
                <div className="h-64 overflow-y-scroll border border-gray-300 p-2 rounded-md mb-2">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className="mb-1">
                      <strong>{msg.username}:</strong> {msg.message}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Type your message..."
                    required
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* --- Game Content --- */}
        {isConnected && players.length < 2 && (
          <div className="text-center mt-8">
            <p className="text-xl">Waiting for more users to start the game...</p>
          </div>
        )}

        {isConnected && players.length >= 1 && (
          <>
            {role === 'super' && (
              <>
                {/* --- Super User Content --- */}

                {/* Image Generation Section */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">Generate Image</h2>
                  <form onSubmit={handleGenerateImage} className="space-y-4">
                    <div>
                      <label htmlFor="imagePrompt" className="block text-sm font-medium text-gray-700">
                        Image Prompt
                      </label>
                      <input
                        type="text"
                        id="imagePrompt"
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                        placeholder="e.g., A serene mountain landscape at sunrise with mist rolling over the peaks."
                        required
                      />
                    </div>

                    {imageError && (
                      <div className="text-red-500 text-sm">
                        {imageError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className={`w-full py-2 px-4 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        imageLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={imageLoading}
                    >
                      {imageLoading ? 'Generating Image...' : 'Generate Image'}
                    </button>
                  </form>

                  {imageUrl && (
                    <div className="mt-6 p-4 bg-purple-100 border border-purple-200 rounded-md">
                      <h3 className="text-lg font-semibold mb-2">Generated Image</h3>
                      <img src={imageUrl} alt="Generated" className="w-full max-w-md rounded-md shadow-md" />

                      {/* New input field for specific question */}
                      <form onSubmit={handleSubmitImageQuestion} className="space-y-4 mt-4">
                        <div>
                          <label htmlFor="superQuestion" className="block text-sm font-medium text-gray-700">
                            Enter a question for players
                          </label>
                          <input
                            type="text"
                            id="superQuestion"
                            value={superQuestion}
                            onChange={(e) => setSuperQuestion(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            placeholder="e.g., What is happening in this image?"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          Send to Players
                        </button>
                      </form>
                    </div>
                  )}
                </section>

                {/* Sound Generation Section */}
                <section className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4">Generate Sound Effects</h2>
                  <form onSubmit={handleGenerateSound} className="space-y-4">
                    <div>
                      <label htmlFor="soundText" className="block text-sm font-medium text-gray-700">
                        Text Description
                      </label>
                      <input
                        type="text"
                        id="soundText"
                        value={soundText}
                        onChange={(e) => setSoundText(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="e.g., bird singing at the street at night"
                        required
                      />
                    </div>

                    {soundError && (
                      <div className="text-red-500 text-sm">
                        {soundError}
                      </div>
                    )}

                    <button
                      type="submit"
                      className={`w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        soundLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={soundLoading}
                    >
                      {soundLoading ? 'Generating...' : 'Generate Sound Effect'}
                    </button>
                  </form>

                  {audioSrc && (
                    <div className="mt-6 p-4 bg-blue-100 border border-blue-200 rounded-md">
                      <h3 className="text-lg font-semibold mb-2">Generated Sound Effect</h3>
                      <audio controls src={audioSrc} className="w-full">
                        Your browser does not support the audio element.
                      </audio>

                      {/* New input field for specific question */}
                      <form onSubmit={handleSubmitAudioQuestion} className="space-y-4 mt-4">
                        <div>
                          <label htmlFor="superAudioQuestion" className="block text-sm font-medium text-gray-700">
                            Enter a question for players
                          </label>
                          <input
                            type="text"
                            id="superAudioQuestion"
                            value={superAudioQuestion}
                            onChange={(e) => setSuperAudioQuestion(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., What is this sound?"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Send to Players
                        </button>
                      </form>
                    </div>
                  )}
                </section>
              </>
            )}

            {role === 'basic' && (
              <>
                {/* --- Basic User Content --- */}
                {/* Display Image and Guess Input */}

                {imageUrl && (
                  <section className="mb-12">
                    <h3 className="text-lg font-semibold mb-2">Question from Super User</h3>
                    <img src={imageUrl} alt="Guess the image" className="w-full max-w-md rounded-md shadow-md" />
                    {/* <p className="mt-2">{imageQuestion}</p> */}
                    <form onSubmit={handleSubmitGuess} className="space-y-4 mt-4">
                      <div>
                        <label htmlFor="userGuess" className="block text-sm font-medium text-gray-700">
                          Your Answer
                        </label>
                        <input
                          type="text"
                          id="userGuess"
                          value={userGuess}
                          onChange={(e) => setUserGuess(e.target.value)}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your answer..."
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Submit Answer
                      </button>
                    </form>
                    {score !== null && (
                      <div className="mt-4">
                        <p>
                          Your Score: <span className="font-bold">{score}</span> / 10
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {/* Play Sound Effect */}
                {audioSrc && (
                  <section className="mb-12">
                    <h3 className="text-lg font-semibold mb-2">Question from Super User</h3>
                    <audio controls src={audioSrc} className="w-full">
                      Your browser does not support the audio element.
                    </audio>
                    <p className="mt-2">{audioQuestion}</p>
                    <form onSubmit={handleSubmitGuessAudio} className="space-y-4 mt-4">
                      <div>
                        <label htmlFor="userAudioGuess" className="block text-sm font-medium text-gray-700">
                          Your Answer
                        </label>
                        <input
                          type="text"
                          id="userAudioGuess"
                          value={userAudioGuess}
                          onChange={(e) => setUserAudioGuess(e.target.value)}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your answer..."
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Submit Answer
                      </button>
                    </form>
                    {audioScore !== null && (
                      <div className="mt-4">
                        <p>
                          Your Score: <span className="font-bold">{audioScore}</span> / 10
                        </p>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
