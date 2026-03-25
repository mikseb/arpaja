const express = require('express');
const app = express();
var port = process.env.PORT || 3001;

const infoTexts = [
  "Vinnaren drar som vanligt lott sist i nästa runda.",
  "Slut på tvättsvampar? Då har du kommit rätt!",
  "Kom ihåg: att man kan fortfarande byta nummer om man har en muntlig överenskommelse.",
  "Även gamla saker kan hitta nya ägare, eller återkomma i nästa års lotteri.",
  "Tvätsvampar kan komma i många paket.",
  "Tvättsvamp eller badsvamp är sfäriska svampdjur av släktet Spongia eller Hippospongia som lever i Medelhavet. -Wikipedia"
]

let players = [];
let availableNumbers = [];
let lastWinner = {
  name: '',
  number: 0
}
let winningNumber = 0;
let infoText = getRandomInfoText();

// PICK_TICKET, DRAW_WINNER, WINNER_ANNOUNCED
let state = 'PICK_TICKET';

const getGameState = () => {
  const numbersLeft = availableNumbers.length
  return {
    players,
    state,
    numbersLeft,
    lastWinner,
    infoText
  }
}

//Server set up
const server = app.listen(port, function () {
  console.log('Running on port ' + port);
});

const corsOrigin = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'https://julklappar.herokuapp.com';

const io = require('socket.io')(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  }
}
);

//serves dist folder on root
app.use('/', express.static(process.cwd() + '/dist'));

function getRandomNumber() {
  return Math.floor(Math.random() * players.length + 1);
}

function getRandomInfoText(){
  const r = Math.floor(Math.random() * infoTexts.length);
  return infoTexts[r];
}

function addPlayer(playerName) {
  if (playerName && !players.some(player => player.name === playerName)) {
    players.push({
      name: playerName,
      currentNumber: 0,
      wins: 0
    })
    flushPlayerNumbers();
    generateNumbers();
    state = 'PICK_TICKET';
  };
}

function removePlayer(playerName) {
  players.forEach((player, index) => {
    if(playerName === player.name){
      players.splice(index, 1)
    }
  })
  flushPlayerNumbers();
  generateNumbers();
  state = 'PICK_TICKET'
  updateGameState();
}

function isValidPlayer(playerName) {
  players.forEach(player => {
    if (playerName == player.name) {
      return true;
    }
  })
  return false;
}

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function pickWinner() {
  state = 'DRAW_WINNER';

  setTimeout(() => {
    updateGameState();
    players.forEach((player, index) => {
      if (player.currentNumber === winningNumber) {
        lastWinner.name = player.name;
        lastWinner.number = winningNumber;
        players[index].wins++;
      }
    })
    state = 'WINNER_ANNOUNCED'
    updateGameState();
  }, 5000)
}

function generateNumbers() {
  winningNumber = getRandomNumber();
  availableNumbers = [];
  players.forEach((value, index) => {
    availableNumbers.push(index + 1);
  })
  availableNumbers = shuffleArray(availableNumbers)
}

function playerPickNumber(playerName) {
  players.forEach((player, index) => {
    if (player.name == playerName && !player.currentNumber) {
      players[index].currentNumber = availableNumbers.pop();
      return;
    }
  })
  if (availableNumbers.length === 0) {
    pickWinner();
  }
}
function playerReturnNumber(playerName) {
  players.forEach((player, index) => {
    if (player.name == playerName && player.currentNumber) {
      availableNumbers.push(player.currentNumber)
      players[index].currentNumber = 0;
      return;
    }
  })
  if (players.filter(player => Boolean(player.currentNumber)).length === 0) {
    flushPlayerNumbers();
    generateNumbers();
    infoText = getRandomInfoText();
    state = 'PICK_TICKET';
    updateGameState();
  }
}

function flushPlayerNumbers() {
  players.forEach((player, index) => {
    players[index].currentNumber = 0;
  })
}

function updateGameState() {
  io.emit('UPDATE_STATE', getGameState())
}


io.on('connection', function (socket) {
  console.log(socket.id)
  socket.on('PLAYER_JOIN', function (name) {
    addPlayer(name);
    updateGameState();
  });
  socket.on('PICK_NUMBER', function (name) {
    playerPickNumber(name);
    updateGameState();
  });
  socket.on('RETURN_NUMBER', function (name) {
    playerReturnNumber(name);
    updateGameState();
  })
  socket.on('REMOVE_PLAYER', function(name) {
    removePlayer(name);
  }),
  socket.on('RESET_GAME_STATE', function(){
    flushPlayerNumbers();
    generateNumbers();
    state = 'PICK_TICKET';
    updateGameState();
  })

});
