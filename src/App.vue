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
        <SelectName
          :initial-room-id="suggestedRoomId"
          :error-message="roomError"
          @set-player="handleSetPlayer"
        />
        <p>Copyright 2022 © Årstadal Web Media Productions</p>
      </div>
      <GameScreen
        v-else
        :name="name"
        :room-id="roomId"
        :socket="socket"
        :game-state="gameState"
        :error-message="roomError"
      />
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
  roomId: "",
  adminName: "",
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
const roomId = ref("");
const protocol = ref(window.location.protocol);
const suggestedRoomId = ref("");
const roomError = ref("");
const gameState = ref<GameState>(emptyGameState);

const socketHost = import.meta.env.DEV ? `http://${window.location.hostname}:3001` : undefined;
const socket: Socket = io(socketHost);

const playerInState = computed(
  () =>
    Boolean(roomId.value) &&
    gameState.value.players.some((player) => player.name === name.value),
);

function handleSetPlayer(payload: { name: string; roomId: string }) {
  name.value = payload.name;
  roomId.value = payload.roomId;
  roomError.value = "";

  socket.emit("PLAYER_JOIN", payload);
}

function changeProtocol() {
  window.location.href = window.location.href.replace("http:", "https:");
}

function handleUpdateState(state: GameState) {
  if (state.roomId !== roomId.value) {
    return;
  }

  roomError.value = "";
  gameState.value = state;
}

function handleRoomSuggestion(payload: { roomId: string }) {
  suggestedRoomId.value = payload.roomId;
}

function handleRoomError(payload: { message: string }) {
  roomError.value = payload.message;
  gameState.value = {
    ...emptyGameState,
    roomId: roomId.value,
  };
}

onMounted(() => {
  socket.on("UPDATE_STATE", handleUpdateState);
  socket.on("ROOM_ID_SUGGESTION", handleRoomSuggestion);
  socket.on("ROOM_ERROR", handleRoomError);
});

onBeforeUnmount(() => {
  socket.off("UPDATE_STATE", handleUpdateState);
  socket.off("ROOM_ID_SUGGESTION", handleRoomSuggestion);
  socket.off("ROOM_ERROR", handleRoomError);
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
