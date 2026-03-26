import express from "express";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, "../dist");
const port = Number(process.env.PORT) || 3001;
const clientOrigin =
  process.env.CLIENT_ORIGIN ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:5173"
    : undefined);

const infoTexts = [
  "Vinnaren drar som vanligt lott sist i nästa runda.",
  "Slut på tvättsvampar? Då har du kommit rätt!",
  "Kom ihåg: att man fortfarande kan byta nummer om man har en muntlig överenskommelse.",
  "Även gamla saker kan hitta nya ägare, eller återkomma i nästa års lotteri.",
  "Tvättsvampar kan komma i många paket.",
  "Tvättsvamp eller badsvamp är sfäriska svampdjur av släktet Spongia eller Hippospongia som lever i Medelhavet. - Wikipedia",
];

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: clientOrigin
    ? {
        origin: clientOrigin,
        methods: ["GET", "POST"],
      }
    : undefined,
});

const players = [];
let availableNumbers = [];
let lastWinner = {
  name: "",
  number: 0,
};
let winningNumber = 0;
let infoText = getRandomInfoText();
let state = "PICK_TICKET";

function getGameState() {
  return {
    players,
    state,
    numbersLeft: availableNumbers.length,
    lastWinner,
    infoText,
  };
}

function getRandomNumber() {
  return Math.floor(Math.random() * players.length + 1);
}

function getRandomInfoText() {
  const index = Math.floor(Math.random() * infoTexts.length);
  return infoTexts[index];
}

function flushPlayerNumbers() {
  players.forEach((player) => {
    player.currentNumber = 0;
  });
}

function shuffleArray(array) {
  let currentIndex = array.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    const temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function generateNumbers() {
  winningNumber = getRandomNumber();
  availableNumbers = players.map((_, index) => index + 1);
  availableNumbers = shuffleArray(availableNumbers);
}

function updateGameState() {
  io.emit("UPDATE_STATE", getGameState());
}

function addPlayer(playerName) {
  if (!playerName || players.some((player) => player.name === playerName)) {
    return;
  }

  players.push({
    name: playerName,
    currentNumber: 0,
    wins: 0,
  });
  flushPlayerNumbers();
  generateNumbers();
  state = "PICK_TICKET";
}

function removePlayer(playerName) {
  const playerIndex = players.findIndex((player) => player.name === playerName);

  if (playerIndex === -1) {
    return;
  }

  players.splice(playerIndex, 1);
  flushPlayerNumbers();
  generateNumbers();
  state = "PICK_TICKET";
  updateGameState();
}

function pickWinner() {
  state = "DRAW_WINNER";

  setTimeout(() => {
    updateGameState();

    players.forEach((player) => {
      if (player.currentNumber === winningNumber) {
        lastWinner = {
          name: player.name,
          number: winningNumber,
        };
        player.wins += 1;
      }
    });

    state = "WINNER_ANNOUNCED";
    updateGameState();
  }, 5000);
}

function playerPickNumber(playerName) {
  const player = players.find((entry) => entry.name === playerName);

  if (player && !player.currentNumber) {
    player.currentNumber = availableNumbers.pop() || 0;
  }

  if (availableNumbers.length === 0 && players.length > 0) {
    pickWinner();
  }
}

function playerReturnNumber(playerName) {
  const player = players.find((entry) => entry.name === playerName);

  if (player?.currentNumber) {
    availableNumbers.push(player.currentNumber);
    player.currentNumber = 0;
  }

  if (players.every((entry) => !entry.currentNumber)) {
    flushPlayerNumbers();
    generateNumbers();
    infoText = getRandomInfoText();
    state = "PICK_TICKET";
    updateGameState();
  }
}

app.use(express.static(distDir));

app.get("*", (_request, response, next) => {
  if (process.env.NODE_ENV === "development") {
    next();
    return;
  }

  response.sendFile(path.join(distDir, "index.html"));
});

io.on("connection", (socket) => {
  console.log(socket.id);

  socket.emit("UPDATE_STATE", getGameState());

  socket.on("PLAYER_JOIN", (name) => {
    addPlayer(name);
    updateGameState();
  });

  socket.on("PICK_NUMBER", (name) => {
    playerPickNumber(name);
    updateGameState();
  });

  socket.on("RETURN_NUMBER", (name) => {
    playerReturnNumber(name);
    updateGameState();
  });

  socket.on("REMOVE_PLAYER", (name) => {
    removePlayer(name);
  });

  socket.on("RESET_GAME_STATE", () => {
    flushPlayerNumbers();
    generateNumbers();
    state = "PICK_TICKET";
    updateGameState();
  });
});

server.listen(port, () => {
  console.log(`Running on port ${port}`);
});
