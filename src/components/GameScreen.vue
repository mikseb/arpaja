<template>
  <div>
    <div>
      <p>
        <span class="latest-winner-title">Senaste vinst</span><br />
        <span class="latest-winner-name"
          >{{ gameState.lastWinner.number }} - {{ gameState.lastWinner.name }}</span
        >
      </p>
    </div>
    <div class="row flex-spaces tabs">
      <input id="tab1" type="radio" name="tabs" checked />
      <label for="tab1">Lotteri</label>

      <input id="tab2" type="radio" name="tabs" />
      <label for="tab2">Tävlande</label>

      <input v-if="isAdmin" id="tab3" type="radio" name="tabs" />
      <label v-if="isAdmin" for="tab3">Admin</label>

      <div id="content1" class="content">
        <div v-if="gameState.state === 'PICK_TICKET'" class="pickTicket">
          <h3 class="status">
            {{ playerHasNumber ? `Du har nummer: ${thisPlayer.currentNumber}` : "Dra en lott" }}
          </h3>
          <p>
            {{
              playerHasNumber
                ? "Väntar på att alla ska dra en lott"
                : "Så fort alla dragit en lott kommer en ny vinnare dras"
            }}
          </p>
          <h5 class="header">Bra att veta:</h5>
          <p class="tips">{{ gameState.infoText }}</p>
          <h4 class="header">Spelare utan lott:</h4>
          <p>
            <span v-for="(player, index) in playersWithoutNumbers" :key="player.name">
              {{ player.name }}{{ index + 1 === playersWithoutNumbers.length ? "" : ", " }}
            </span>
          </p>
        </div>
        <div v-if="gameState.state === 'DRAW_WINNER'" class="pickTicket">
          <h3 class="status">Drar en vinnare..</h3>
          <div class="row flex-spaces">
            <svg
              id="fi_135516"
              class="bowl center margin"
              height="50pt"
              viewBox="0 -93 512 512"
              width="50pt"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m511.992188 69.132812c0-39.714843-98.597657-62.855468-208.46875-68.019531-15.695313-.734375-31.621094-1.113281-47.515626-1.113281-15.898437 0-31.824218.367188-47.53125 1.113281-109.871093 5.171875-208.476562 28.3125-208.476562 68.019531v1.441407c0 141.152343 114.84375 255.996093 256.003906 255.996093 141.152344 0 255.996094-114.84375 255.996094-255.996093v-1.441407c-.007812.007813-.007812.007813-.007812 0zm-19.339844.007813c-.011719 20.308594-92.195313 49.792969-236.65625 49.792969-144.460938 0-236.636719-29.496094-236.65625-49.792969.011718-20.308594 92.207031-49.792969 236.667968-49.792969 144.460938 0 236.632813 29.488282 236.644532 49.792969zm-236.648438 238.085937c-121.089844 0-221.171875-91.429687-234.972656-208.863281 41.570312 26.292969 138.699219 39.898438 234.972656 39.898438 96.277344 0 193.390625-13.617188 234.964844-39.898438-13.808594 117.441407-113.882812 208.863281-234.964844 208.863281zm0 0"
              />
            </svg>
          </div>
        </div>
        <div v-if="gameState.state === 'WINNER_ANNOUNCED'" class="winnerAnnounced">
          <h4>Vinnare:</h4>
          <div class="paper">
            <div>
              <h1 class="status">{{ gameState.lastWinner.number }}</h1>
              <h3>{{ gameState.lastWinner.name }}</h3>
              <h5>Gå och hämta ditt paket</h5>
            </div>
          </div>
          <p>Glöm inte att lämna tillbaka din lott..</p>
        </div>
      </div>
      <div id="content2" class="content">
        <ScoreTable :players="players" />
      </div>
      <div id="content3" class="content">
        <h3>Admin</h3>
        <button @click="toggleAdminAction">Enable admin buttons</button><br />
        <span v-for="player in players" :key="player.name">
          {{ player.name }}
          <button v-if="adminActionEnabled" class="btn-small" @click="kickPlayer(player.name)">
            Kick
          </button>
          <br />
        </span>
        <button v-if="adminActionEnabled" @click="resetGameState">Reset gameState</button>
      </div>
    </div>
    <div class="bottom-menu container row">
      <div class="col-12">
        <button
          v-if="!playerHasNumber && gameState.state === 'PICK_TICKET'"
          class="btn-block btn-game"
          @click="pickTicket"
        >
          Dra en lott
        </button>
        <p v-if="playerHasNumber && gameState.state !== 'WINNER_ANNOUNCED'" class="currentNumber">
          Nr: {{ thisPlayer.currentNumber }}
        </p>
        <button
          v-if="playerHasNumber && gameState.state === 'WINNER_ANNOUNCED'"
          class="btn-block btn-game"
          @click="returnTicket"
        >
          Lämna tillbaka lott
        </button>
      </div>
      <div class="progress">
        <div class="bar" :style="{ width: `${ticketBarWidth}%` }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { Socket } from "socket.io-client";

import type { GameState, Player } from "@/types";
import ScoreTable from "./ScoreTable.vue";

const props = defineProps<{
  name: string;
  socket: Socket;
  gameState: GameState;
}>();

const adminActionEnabled = ref(false);
const emptyPlayer: Player = {
  name: "",
  currentNumber: 0,
  wins: 0,
};

const players = computed(() => props.gameState.players);
const thisPlayer = computed(
  () => players.value.find((player) => player.name === props.name) ?? emptyPlayer,
);
const playersWithoutNumbers = computed(() =>
  players.value.filter((player) => player.currentNumber === 0),
);
const playerHasNumber = computed(() => Boolean(thisPlayer.value.currentNumber));
const ticketBarWidth = computed(() => {
  if (players.value.length === 0) {
    return 0;
  }

  return Math.floor((props.gameState.numbersLeft / players.value.length) * 100);
});
const isAdmin = computed(() => props.name === "Mikko");

function toggleAdminAction() {
  adminActionEnabled.value = !adminActionEnabled.value;
}

function pickTicket() {
  if (props.gameState.state === "PICK_TICKET") {
    props.socket.emit("PICK_NUMBER", props.name);
  }
}

function returnTicket() {
  if (props.gameState.state === "WINNER_ANNOUNCED") {
    props.socket.emit("RETURN_NUMBER", props.name);
  }
}

function kickPlayer(playerName: string) {
  props.socket.emit("REMOVE_PLAYER", playerName);
}

function resetGameState() {
  props.socket.emit("RESET_GAME_STATE");
}
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

.paper {
  padding: 15px;
}

.currentNumber {
  text-align: center;
  font-size: 48px;
  margin: 0;
}

.winnerAnnounced {
  text-align: center;
}

.winnerAnnounced h1,
.winnerAnnounced h3,
.winnerAnnounced h4,
.winnerAnnounced h5 {
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
