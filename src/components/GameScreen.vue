<template>
  <div>
    <div>
      <p>
        <span class="latest-winner-title">Senaste vinst</span><br>
        <span class="latest-winner-name">{{gameState.lastWinner.number}} - {{gameState.lastWinner.name}}</span>
      </p>
    </div>
    <div class="row flex-spaces tabs">
      <input id="tab1" type="radio" name="tabs" checked>
      <label for="tab1">Lotteri</label>

      <input id="tab2" type="radio" name="tabs">
      <label for="tab2">Tävlande</label>

      <input v-if="name === 'Mikko' " id="tab3" type="radio" name="tabs">
      <label v-if="name === 'Mikko' " for="tab3">Admin</label>

      <div class="content" id="content1">
        <div v-if="gameState.state === 'PICK_TICKET'" class='pickTicket'>
          <h3 class="status">{{playerHasNumber ? "Du har nummer: " + thisPlayer.currentNumber : "Dra en lott"}} </h3>
          <p>{{playerHasNumber ? "Väntar på att alla ska dra en lott" : "Så fort alla dragit en lott kommer en ny vinnare dras"}}</p>
          <h5 class="header">Bra att veta:</h5>
          <p class="tips">
            {{gameState.infoText}}
          </p>
          <h4 class="header">Spelare utan lott:</h4>
          <p>
            <span v-for="(player, index) in playersWithNumbers" :key="index" >{{ player.name }}{{index+1 == playersWithNumbers.length ? '' : ', '}}</span>
          </p>
        </div>
        <div v-if="gameState.state === 'DRAW_WINNER'" class='pickTicket'>
          <h3 class="status">Och vinnaren är...</h3>
          <svg class="bowl center" height="50pt" viewBox="0 -93 512 512" width="50pt" xmlns="http://www.w3.org/2000/svg" id="fi_135516"><path d="m511.992188 69.132812c0-39.714843-98.597657-62.855468-208.46875-68.019531-15.695313-.734375-31.621094-1.113281-47.515626-1.113281-15.898437 0-31.824218.367188-47.53125 1.113281-109.871093 5.171875-208.476562 28.3125-208.476562 68.019531v1.441407c0 141.152343 114.84375 255.996093 256.003906 255.996093 141.152344 0 255.996094-114.84375 255.996094-255.996093v-1.441407c-.007812.007813-.007812.007813-.007812 0zm-19.339844.007813c-.011719 20.308594-92.195313 49.792969-236.65625 49.792969-144.460938 0-236.636719-29.496094-236.65625-49.792969.011718-20.308594 92.207031-49.792969 236.667968-49.792969 144.460938 0 236.632813 29.488282 236.644532 49.792969zm-236.648438 238.085937c-121.089844 0-221.171875-91.429687-234.972656-208.863281 41.570312 26.292969 138.699219 39.898438 234.972656 39.898438 96.277344 0 193.390625-13.617188 234.964844-39.898438-13.808594 117.441407-113.882812 208.863281-234.964844 208.863281zm0 0"></path></svg>
        </div>
        <div v-if="gameState.state === 'WINNER_ANNOUNCED'" class='pickTicket'>
          <h3 class="status">Lottnumber: {{gameState.lastWinner.number}}</h3>
          <h4>{{gameState.lastWinner.name}} kan gå och hämta sitt paket</h4>
          <p>Glöm inte att lämna tillbaka din lott..</p>
        </div>
      </div>
      <div class="content" id="content2">
        <Score-Table :players="gameState.players"/>
      </div>
      <div class="content" id="content3">
        <h3>Admin</h3>
        <button v-on:click="adminActionEnabled = !adminActionEnabled">Enable admin buttons</button><br>
        <span v-for="(player, index) in players" :key="index">{{player.name}} <button v-if="adminActionEnabled" @click='kickPlayer(player.name)' class="btn-small">Kick</button><br></span>
        <button  v-if="adminActionEnabled" v-on:click="resetGameState">Reset gameState</button>
      </div>
    </div>
    <div class="bottom-menu container row">
      <div class="col-12">
        <Button v-if="!playerHasNumber && this.gameState.state === 'PICK_TICKET'" v-on:click="pickTicket" class="btn-block btn-game">Dra en lott</Button>
        <p v-if="playerHasNumber && gameState.state !== 'WINNER_ANNOUNCED'" class="currentNumber">Nr: {{thisPlayer.currentNumber}}</p>
        <Button v-if="playerHasNumber && gameState.state === 'WINNER_ANNOUNCED'" v-on:click="returnTicket" class="btn-block btn-game">Lämna tillbaka lott</Button>
      </div>
      <div class="progress">
        <div class="bar" :style="`width:${ticketBarWidth}%`"></div>
      </div>
    </div>
  </div>
</template>
<script>
import ScoreTable from "./ScoreTable.vue";

export default {
  name: "GameScreen",
  components: {
    ScoreTable
  },
  props: ["name", "socket", "gameState"],
  data() {
    return {
      adminActionEnabled: false
    };
  },
  computed: {
    players() {
      return (this.gameState && this.gameState.players) || [];
    },
    thisPlayer() {
      return (
        (this.gameState &&
          this.gameState.players.filter(
            player => player.name == this.name
          )[0]) ||
        {}
      );
    },
    playersWithNumbers() {
      return (
        this.players.filter(player => {
          return player.currentNumber === 0;
        }) || []
      );
    },
    playerHasNumber() {
      return this.players.some(
        player => player.name == this.name && player.currentNumber
      );
    },
    ticketBarWidth() {
      const playersTotal =
        (this.gameState && this.gameState.players.length) || 0;
      const numbersLeft = this.gameState && this.gameState.numbersLeft;
      return Math.floor(numbersLeft / playersTotal * 100);
    }
  },
  methods: {
    pickTicket() {
      if (this.gameState.state === "PICK_TICKET") {
        this.socket.emit("PICK_NUMBER", this.name);
      }
    },
    returnTicket() {
      if (this.gameState.state === "WINNER_ANNOUNCED") {
        this.socket.emit("RETURN_NUMBER", this.name);
      }
    },
    kickPlayer(playerName) {
      this.socket.emit("REMOVE_PLAYER", playerName);
    },
    resetGameState() {
      this.socket.emit("RESET_GAME_STATE");
    }
  }
};
</script>

<style>
.status {
  margin-top: 0;
  margin-bottom: 10px;
}
.bottom-menu {
  position: fixed !important;
  bottom: 0;
  height: 130px;
  background: #fff;
  padding-top: 8px;
}
.latest-winner-title {
  font-size: 24px;
}
.latest-winner-name {
  font-size: 36px;
}
.header {
  margin-bottom: 2px;
}
.tips {
  margin-top: 0;
}
.currentNumber {
  text-align: center;
  font-size: 48px;
  margin: 0;
}
.btn-game {
  margin-bottom: 0;
}
.bowl {
  animation-name: wiggle;
  animation-duration: 1000ms;
  animation-iteration-count: infinite;
}
@keyframes wiggle {
  0% {
    transform: rotate(10deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(20deg);
  }
  75% {
    transform: rotate(-5deg);
  }
  100% {
    transform: rotate(0deg);
  }
}
</style>

