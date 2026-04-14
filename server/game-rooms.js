export const ROOM_ID_LENGTH = 4;

const infoTexts = [
  "Vinnaren drar som vanligt lott sist i nästa runda.",
  "Slut på tvättsvampar? Då har du kommit rätt!",
  "Kom ihåg: att man kan fortfarande byta nummer om man har en muntlig överenskommelse.",
  "Även gamla saker kan hitta nya ägare, eller återkomma i nästa års lotteri.",
  "Tvätsvampar kan komma i många paket.",
  "Tvättsvamp eller badsvamp är sfäriska svampdjur av släktet Spongia eller Hippospongia som lever i Medelhavet. -Wikipedia"
];

export const GAME_STATES = {
  PICK_TICKET: "PICK_TICKET",
  DRAW_WINNER: "DRAW_WINNER",
  WINNER_ANNOUNCED: "WINNER_ANNOUNCED"
};

export function normalizeRoomId(roomId) {
  return String(roomId || "")
    .trim()
    .toUpperCase();
}

export function isValidRoomId(roomId) {
  return /^[A-Z0-9]{4}$/.test(normalizeRoomId(roomId));
}

function getRandomInfoText() {
  const randomIndex = Math.floor(Math.random() * infoTexts.length);
  return infoTexts[randomIndex];
}

function getRandomNumber(max) {
  return Math.floor(Math.random() * max + 1);
}

function shuffleArray(array) {
  const nextArray = array.slice();
  let currentIndex = nextArray.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    const temporaryValue = nextArray[currentIndex];
    nextArray[currentIndex] = nextArray[randomIndex];
    nextArray[randomIndex] = temporaryValue;
  }

  return nextArray;
}

function createPlayer(playerName) {
  return {
    name: playerName,
    currentNumber: 0,
    wins: 0
  };
}

export function createRoomState() {
  return {
    players: [],
    adminName: "",
    availableNumbers: [],
    lastWinner: {
      name: "",
      number: 0
    },
    winningNumber: 0,
    infoText: getRandomInfoText(),
    state: GAME_STATES.PICK_TICKET
  };
}

export function createInitialRoomsState() {
  return {
    rooms: {}
  };
}

export function getRoomState(store, roomId) {
  return store.rooms[normalizeRoomId(roomId)] || null;
}

export function upsertRoom(store, roomId, roomState) {
  const normalizedRoomId = normalizeRoomId(roomId);

  return {
    ...store,
    rooms: {
      ...store.rooms,
      [normalizedRoomId]: roomState
    }
  };
}

export function removeRoom(store, roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);
  const nextRooms = { ...store.rooms };
  delete nextRooms[normalizedRoomId];

  return {
    ...store,
    rooms: nextRooms
  };
}

export function getPublicGameState(roomState) {
  return {
    players: roomState.players,
    adminName: roomState.adminName,
    state: roomState.state,
    numbersLeft: roomState.availableNumbers.length,
    lastWinner: roomState.lastWinner,
    infoText: roomState.infoText
  };
}

function generateNumbers(roomState) {
  const availableNumbers = shuffleArray(
    roomState.players.map((player, index) => index + 1)
  );

  return {
    ...roomState,
    winningNumber: roomState.players.length > 0 ? getRandomNumber(roomState.players.length) : 0,
    availableNumbers
  };
}

function flushPlayerNumbers(roomState) {
  return {
    ...roomState,
    players: roomState.players.map(player => ({
      ...player,
      currentNumber: 0
    }))
  };
}

function resetRound(roomState) {
  return {
    ...generateNumbers(flushPlayerNumbers(roomState)),
    state: GAME_STATES.PICK_TICKET
  };
}

export function addPlayerToRoom(roomState, playerName) {
  if (!playerName || roomState.players.some(player => player.name === playerName)) {
    return roomState;
  }

  const nextState = {
    ...roomState,
    players: [...roomState.players, createPlayer(playerName)],
    adminName: roomState.adminName || playerName
  };

  return resetRound(nextState);
}

export function removePlayerFromRoom(roomState, playerName) {
  const nextPlayers = roomState.players.filter(player => player.name !== playerName);

  if (nextPlayers.length === roomState.players.length) {
    return roomState;
  }

  const nextState = resetRound({
    ...roomState,
    players: nextPlayers,
    adminName:
      roomState.adminName === playerName ? (nextPlayers[0] ? nextPlayers[0].name : "") : roomState.adminName
  });

  return {
    ...nextState,
    lastWinner: nextPlayers.length === 0 ? { name: "", number: 0 } : nextState.lastWinner
  };
}

export function assignNumber(roomState, playerName) {
  if (roomState.state !== GAME_STATES.PICK_TICKET) {
    return roomState;
  }

  let assignedNumber = null;
  const availableNumbers = roomState.availableNumbers.slice();
  const players = roomState.players.map(player => {
    if (player.name !== playerName || player.currentNumber) {
      return player;
    }

    assignedNumber = availableNumbers.pop();
    return {
      ...player,
      currentNumber: assignedNumber || 0
    };
  });

  return {
    ...roomState,
    players,
    availableNumbers
  };
}

export function finalizeWinner(roomState) {
  const winningPlayer = roomState.players.find(
    player => player.currentNumber === roomState.winningNumber
  );

  if (!winningPlayer) {
    return {
      ...roomState,
      state: GAME_STATES.WINNER_ANNOUNCED
    };
  }

  return {
    ...roomState,
    players: roomState.players.map(player =>
      player.name === winningPlayer.name
        ? { ...player, wins: player.wins + 1 }
        : player
    ),
    lastWinner: {
      name: winningPlayer.name,
      number: roomState.winningNumber
    },
    state: GAME_STATES.WINNER_ANNOUNCED
  };
}

export function shouldPickWinner(roomState) {
  return roomState.availableNumbers.length === 0 && roomState.players.length > 0;
}

export function returnNumber(roomState, playerName) {
  let returnedNumber = null;

  const players = roomState.players.map(player => {
    if (player.name !== playerName || !player.currentNumber) {
      return player;
    }

    returnedNumber = player.currentNumber;
    return {
      ...player,
      currentNumber: 0
    };
  });

  const nextState = {
    ...roomState,
    players,
    availableNumbers:
      returnedNumber === null
        ? roomState.availableNumbers
        : [...roomState.availableNumbers, returnedNumber]
  };

  const hasPickedNumbers = nextState.players.some(player => Boolean(player.currentNumber));

  if (!hasPickedNumbers) {
    return {
      ...resetRound(nextState),
      infoText: getRandomInfoText()
    };
  }

  return nextState;
}

export function resetGameState(roomState) {
  return resetRound(roomState);
}

export function generateRoomId(existingRoomIds) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const usedRoomIds = new Set(existingRoomIds.map(normalizeRoomId));

  let roomId = "";

  do {
    roomId = Array.from({ length: ROOM_ID_LENGTH }, () => {
      const characterIndex = Math.floor(Math.random() * alphabet.length);
      return alphabet[characterIndex];
    }).join("");
  } while (usedRoomIds.has(roomId));

  return roomId;
}
