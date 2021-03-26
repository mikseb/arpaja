const express = require('express');
const app = express();
var port = process.env.PORT || 3001;

let players = [];
let availableNumbers = [];

//Server set up
const server = app.listen(port, function() {
    console.log('server running on port ' + port);
});
const io = require('socket.io')(server, {
    cors: {
      origin: "http://localhost:8080",
      methods: ["GET", "POST"]
    }
  }
);
console.log(process.cwd())
//serves dist folder on root
app.use('/', express.static(process.cwd() + '/dist'))

function addPlayer(playerName){
    players.push({
        name: playerName,
        currentNumber: 0,
        wins: 0
    })
}

function removePlayer(playerName){
    //todo
}

function isValidPlayer(playerName){
    players.forEach(player => {
        if (playerName == player.name){
            return true;
        }
    })
    return false;
}

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function generateNumbers(){
    availableNumbers = [];
    players.forEach((value, index) =>{
        availableNumbers.push(index+1);
    })
    availableNumbers = shuffleArray(availableNumbers);
}

function pickNumber(playerName) {
    players.forEach(player =>{
        if(player.name == playerName){
            
        }
    })
}

io.on('connection', function(socket) {
    console.log(socket.id)
    socket.on('SEND_MESSAGE', function(data) {
        io.emit('MESSAGE', data)
    });
    socket.on('PLAYER_JOIN', function(name) {

        addPlayer(name)
        io.emit('UPDATE_PLAYERS', players)

    });
});
