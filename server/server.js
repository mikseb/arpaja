const express = require("express");
const {
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
  upsertRoom
} = require("./game-rooms");

const app = express();
const port = process.env.PORT || 3001;

let store = createInitialRoomsState();
const roomTimers = new Map();

const server = app.listen(port, function () {
  console.log("Running on port " + port);
});

const isDevelopment = process.env.NODE_ENV === "development";
const corsOrigin = isDevelopment ? true : "https://julklappar.herokuapp.com";

const io = require("socket.io")(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  }
});

app.use("/", express.static(process.cwd() + "/dist"));

function emitRoomState(roomId) {
  const roomState = getRoomState(store, roomId);

  if (!roomState) {
    return;
  }

  io.to(roomId).emit("UPDATE_STATE", {
    roomId,
    ...getPublicGameState(roomState)
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
    }, 5000)
  );
}

function startWinnerDraw(roomId) {
  updateRoom(roomId, roomState => ({
    ...roomState,
    state: GAME_STATES.DRAW_WINNER
  }));
  emitRoomState(roomId);
  scheduleWinner(roomId);
}

function handlePlayerJoin(socket, payload) {
  const playerName = String(payload && payload.name ? payload.name : "").trim();
  const roomId = normalizeRoomId(payload && payload.roomId);

  if (!playerName || !isValidRoomId(roomId)) {
    socket.emit("ROOM_ERROR", {
      message: `Room id must be ${ROOM_ID_LENGTH} letters or numbers.`
    });
    return;
  }

  socket.join(ensureRoom(roomId));
  socket.data.playerName = playerName;
  socket.data.roomId = roomId;

  updateRoom(roomId, roomState => addPlayerToRoom(roomState, playerName));
  emitRoomState(roomId);
}

function requireRoom(socket, payload) {
  const roomId = normalizeRoomId(
    (payload && payload.roomId) || socket.data.roomId
  );
  const roomState = getRoomState(store, roomId);

  if (!roomState) {
    socket.emit("ROOM_ERROR", {
      message: "That room could not be found."
    });
    return null;
  }

  return {
    roomId,
    roomState
  };
}

function requireAdmin(socket, room) {
  if (socket.data.playerName !== room.roomState.adminName) {
    socket.emit("ROOM_ERROR", {
      message: "Only the room admin can do that."
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

  const nextRoom = updateRoom(room.roomId, roomState =>
    assignNumber(roomState, payload.name)
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
  updateRoom(room.roomId, roomState => returnNumber(roomState, payload.name));
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
  const nextRoom = updateRoom(room.roomId, roomState =>
    removePlayerFromRoom(roomState, payload.name)
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

io.on("connection", function (socket) {
  console.log(socket.id);

  socket.emit("ROOM_ID_SUGGESTION", {
    roomId: generateRoomId(Object.keys(store.rooms))
  });

  socket.on("PLAYER_JOIN", function (payload) {
    handlePlayerJoin(socket, payload);
  });

  socket.on("PICK_NUMBER", function (payload) {
    handlePickNumber(socket, payload);
  });

  socket.on("RETURN_NUMBER", function (payload) {
    handleReturnNumber(socket, payload);
  });

  socket.on("REMOVE_PLAYER", function (payload) {
    handleRemovePlayer(socket, payload);
  });

  socket.on("RESET_GAME_STATE", function (payload) {
    handleResetGameState(socket, payload);
  });
});
