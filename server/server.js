import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";

import {
  GAME_STATES,
  ROOM_ID_LENGTH,
  addPlayerToRoom,
  assignNumber,
  createInitialRoomsState,
  createRoomState,
  finalizeWinner,
  generateRoomId,
  getPublicGameState,
  getRoomState,
  isValidRoomId,
  normalizeRoomId,
  removePlayerFromRoom,
  removeRoom,
  resetGameState,
  returnNumber,
  shouldPickWinner,
  upsertRoom,
} from "./game-rooms.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");
const port = Number(process.env.PORT) || 3001;
const isDevelopment = process.env.NODE_ENV === "development";
const clientOrigin = process.env.CLIENT_ORIGIN || (isDevelopment ? true : undefined);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors:
    clientOrigin === true
      ? {
          origin: true,
          methods: ["GET", "POST"],
        }
      : clientOrigin
        ? {
            origin: clientOrigin,
            methods: ["GET", "POST"],
          }
        : undefined,
});

let store = createInitialRoomsState();
const roomTimers = new Map();

app.use("/", express.static(distDir));

function emitRoomState(roomId) {
  const roomState = getRoomState(store, roomId);

  if (!roomState) {
    return;
  }

  io.to(roomId).emit("UPDATE_STATE", {
    roomId,
    ...getPublicGameState(roomState),
  });
}

function ensureRoom(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);
  const existingRoom = getRoomState(store, normalizedRoomId);

  if (existingRoom) {
    return normalizedRoomId;
  }

  store = upsertRoom(store, normalizedRoomId, createRoomState());
  return normalizedRoomId;
}

function updateRoom(roomId, updater) {
  const normalizedRoomId = normalizeRoomId(roomId);
  const currentRoom = getRoomState(store, normalizedRoomId) || createRoomState();
  const nextRoom = updater(currentRoom);

  if (nextRoom.players.length === 0) {
    store = removeRoom(store, normalizedRoomId);
    return null;
  }

  store = upsertRoom(store, normalizedRoomId, nextRoom);
  return nextRoom;
}

function clearRoomTimer(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);
  const timer = roomTimers.get(normalizedRoomId);

  if (timer) {
    clearTimeout(timer);
    roomTimers.delete(normalizedRoomId);
  }
}

function scheduleWinner(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);

  clearRoomTimer(normalizedRoomId);

  roomTimers.set(
    normalizedRoomId,
    setTimeout(() => {
      roomTimers.delete(normalizedRoomId);

      const roomState = getRoomState(store, normalizedRoomId);
      if (!roomState || roomState.state !== GAME_STATES.DRAW_WINNER) {
        return;
      }

      updateRoom(normalizedRoomId, finalizeWinner);
      emitRoomState(normalizedRoomId);
    }, 5000),
  );
}

function startWinnerDraw(roomId) {
  updateRoom(roomId, (roomState) => ({
    ...roomState,
    state: GAME_STATES.DRAW_WINNER,
  }));
  emitRoomState(roomId);
  scheduleWinner(roomId);
}

function handlePlayerJoin(socket, payload) {
  const playerName = String(payload?.name ?? "").trim();
  const roomId = normalizeRoomId(payload?.roomId);

  if (!playerName || !isValidRoomId(roomId)) {
    socket.emit("ROOM_ERROR", {
      message: `Room id must be ${ROOM_ID_LENGTH} letters or numbers.`,
    });
    return;
  }

  socket.join(ensureRoom(roomId));
  socket.data.playerName = playerName;
  socket.data.roomId = roomId;

  updateRoom(roomId, (roomState) => addPlayerToRoom(roomState, playerName));
  emitRoomState(roomId);
}

function requireRoom(socket, payload) {
  const roomId = normalizeRoomId(payload?.roomId || socket.data.roomId);
  const roomState = getRoomState(store, roomId);

  if (!roomState) {
    socket.emit("ROOM_ERROR", {
      message: "That room could not be found.",
    });
    return null;
  }

  return { roomId, roomState };
}

function requireAdmin(socket, room) {
  if (socket.data.playerName !== room.roomState.adminName) {
    socket.emit("ROOM_ERROR", {
      message: "Only the room admin can do that.",
    });
    return false;
  }

  return true;
}

function handlePickNumber(socket, payload) {
  const room = requireRoom(socket, payload);
  if (!room) {
    return;
  }

  clearRoomTimer(room.roomId);

  const nextRoom = updateRoom(room.roomId, (roomState) =>
    assignNumber(roomState, payload.name),
  );

  if (!nextRoom) {
    return;
  }

  if (shouldPickWinner(nextRoom)) {
    startWinnerDraw(room.roomId);
    return;
  }

  emitRoomState(room.roomId);
}

function handleReturnNumber(socket, payload) {
  const room = requireRoom(socket, payload);
  if (!room) {
    return;
  }

  clearRoomTimer(room.roomId);
  updateRoom(room.roomId, (roomState) => returnNumber(roomState, payload.name));
  emitRoomState(room.roomId);
}

function handleRemovePlayer(socket, payload) {
  const room = requireRoom(socket, payload);
  if (!room) {
    return;
  }

  if (!requireAdmin(socket, room)) {
    return;
  }

  clearRoomTimer(room.roomId);
  const nextRoom = updateRoom(room.roomId, (roomState) =>
    removePlayerFromRoom(roomState, payload.name),
  );

  if (!nextRoom) {
    socket.leave(room.roomId);
    return;
  }

  emitRoomState(room.roomId);
}

function handleResetGameState(socket, payload) {
  const room = requireRoom(socket, payload);
  if (!room) {
    return;
  }

  if (!requireAdmin(socket, room)) {
    return;
  }

  clearRoomTimer(room.roomId);
  updateRoom(room.roomId, resetGameState);
  emitRoomState(room.roomId);
}

io.on("connection", (socket) => {
  socket.emit("ROOM_ID_SUGGESTION", {
    roomId: generateRoomId(Object.keys(store.rooms)),
  });

  socket.on("PLAYER_JOIN", (payload) => {
    handlePlayerJoin(socket, payload);
  });

  socket.on("PICK_NUMBER", (payload) => {
    handlePickNumber(socket, payload);
  });

  socket.on("RETURN_NUMBER", (payload) => {
    handleReturnNumber(socket, payload);
  });

  socket.on("REMOVE_PLAYER", (payload) => {
    handleRemovePlayer(socket, payload);
  });

  socket.on("RESET_GAME_STATE", (payload) => {
    handleResetGameState(socket, payload);
  });
});

server.listen(port, () => {
  console.log(`Running on port ${port}`);
});
