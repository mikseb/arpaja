<template>
  <div id="app" class="main">
    <div class="container">
      <div v-if="!playerInState" class="pre-game">
        <h2>Julklappslotteri</h2>
        <p>
          En hemmagjord present säger mer än en färdigköpt pryl. Den säger att
          man använt tid och kraft. Den säger att det är något personligt. Den
          säger att man får för lite veckopeng.
          <br /><br />
          - Steen og Stoffer
        </p>
        <button v-if="protocol === 'http:'" @click="changeProtocol">Gå till https</button>
        <SelectName @set-name="handleSetName" />
        <p>Copyright 2022 © Årstadal Web Media Productions</p>
      </div>
      <GameScreen v-else :name="name" :socket="socket" :game-state="gameState" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { io, type Socket } from "socket.io-client";

import GameScreen from "./components/GameScreen.vue";
import SelectName from "./components/SelectName.vue";
import type { GameState } from "./types";

const emptyGameState: GameState = {
  players: [],
  state: "PICK_TICKET",
  numbersLeft: 0,
  lastWinner: {
    name: "",
    number: 0,
  },
  infoText: "",
};

const name = ref("");
const protocol = ref(window.location.protocol);
const gameState = ref<GameState>(emptyGameState);
const socket: Socket = io(import.meta.env.DEV ? "http://localhost:3001" : undefined);

const playerInState = computed(() =>
  gameState.value.players.some((player) => player.name === name.value),
);

function handleSetName(playerName: string) {
  name.value = playerName;
  socket.emit("PLAYER_JOIN", playerName);
}

function changeProtocol() {
  window.location.href = window.location.href.replace("http:", "https:");
}

function handleUpdateState(state: GameState) {
  gameState.value = state;
}

onMounted(() => {
  socket.on("UPDATE_STATE", handleUpdateState);
});

onBeforeUnmount(() => {
  socket.off("UPDATE_STATE", handleUpdateState);
  socket.close();
});
</script>

<style>
.main {
  padding-bottom: 130px !important;
}

h2 {
  margin-top: 0;
}
</style>
