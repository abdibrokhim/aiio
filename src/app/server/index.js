// socket-server/index.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fetch = require('node-fetch'); // Add this line to use fetch in Node.js

const app = express();
const server = http.createServer(app);

// Configure CORS to allow requests from your Next.js frontend
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // Replace with your frontend's URL
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

// Store active game rooms and their players
const gameRooms = {};

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // After a new client joins a room
  socket.on('joinRoom', ({ roomId, username }) => {
    socket.join(roomId);

    if (!gameRooms[roomId]) {
      gameRooms[roomId] = {
        players: [],
        gameState: {},
      };
    }

    const player = { socketId: socket.id, username };
    gameRooms[roomId].players.push(player);
    console.log(`${username} joined room: ${roomId}`);

    // Assign roles
    if (gameRooms[roomId].players.length === 1) {
      // First player is super user
      player.role = 'super';
    } else {
      // Other players are basic users
      player.role = 'basic';
    }

    // Emit role assigned to the player
    io.to(player.socketId).emit('rolesAssigned', { role: player.role });

    // Update the players list
    io.to(roomId).emit('updatePlayers', gameRooms[roomId].players);
  });

  // Handle chat messages
  socket.on('chatMessage', ({ roomId, message, username }) => {
    io.to(roomId).emit('newChatMessage', { message, username });
  });

  // Handle imageQuestion event
  socket.on('imageQuestion', ({ imageUrl, question }) => {
    const roomId = Object.keys(socket.rooms).find((r) => r !== socket.id);
    if (roomId) {
      // Broadcast to all basic users in the room
      socket.to(roomId).emit('imageQuestion', { imageUrl, question });
    }
  });

  // Handle audioQuestion event
  socket.on('audioQuestion', ({ audioSrc, question }) => {
    const roomId = Object.keys(socket.rooms).find((r) => r !== socket.id);
    if (roomId) {
      // Broadcast to all basic users in the room
      socket.to(roomId).emit('audioQuestion', { audioSrc, question });
    }
  });

  // Handle submitGuess event from basic users
  socket.on('submitGuess', ({ guess, socketId, roomId }) => {
    const room = gameRooms[roomId];
    if (!room) return;

    // Find the super user in the room
    const superUser = room.players.find((player) => player.role === 'super');
    if (superUser) {
      // Send the guess to the super user
      io.to(superUser.socketId).emit('submitGuess', { guess, socketId: socketId });
    }
  });

  // Handle submitAudioGuess event from basic users
  socket.on('submitAudioGuess', ({ guess, socketId, roomId }) => {
    const room = gameRooms[roomId];
    if (!room) return;

    // Find the super user in the room
    const superUser = room.players.find((player) => player.role === 'super');
    if (superUser) {
      // Send the guess to the super user
      io.to(superUser.socketId).emit('submitAudioGuess', { guess, socketId: socketId });
    }
  });

  // Handle evaluationResult from super user
  socket.on('evaluationResult', ({ grade, targetSocketId }) => {
    io.to(targetSocketId).emit('evaluationResult', { grade });
  });

  // Handle evaluationAudioResult from super user
  socket.on('evaluationAudioResult', ({ grade, targetSocketId }) => {
    io.to(targetSocketId).emit('evaluationAudioResult', { grade });
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Remove the player from any game rooms they were part of
    for (const roomId in gameRooms) {
      const room = gameRooms[roomId];
      room.players = room.players.filter((player) => player.socketId !== socket.id);
      io.to(roomId).emit('updatePlayers', room.players);
      if (room.players.length === 0) {
        delete gameRooms[roomId];
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
