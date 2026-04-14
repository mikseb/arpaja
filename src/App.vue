
<template>
  <div class="main" id="app">
    <div class="container">
      <div v-if="!playerInState" class="pre-game">
        <h2>Julklappslotteri</h2>
        <p>En hemmagjord present säger mer än en färdigköpt pryl. Den säger att man använt tid och kraft. Den säger att det är något personligt. Den säger att man får för lite veckopeng.<br><br> - Steen og Stoffer</p>
        <button v-if="protocol === 'http:'" v-on:click="changeProtocol">Gå till https</button>
        <Select-Name
          :initial-room-id="suggestedRoomId"
          :error-message="roomError"
          @set-player="handleSetPlayer"
        />
        <p>Copyright 2022 © Årstadal Web Media Productions</p>
      </div> 
      <div v-if="playerInState">
        <GameScreen
          :name="name"
          :room-id="roomId"
          :socket="socket"
          :gameState="gameState"
          :error-message="roomError"
        />
      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';
import SelectName from './components/SelectName.vue'
import GameScreen from './components/GameScreen.vue'

const ioHost = process.env.NODE_ENV === 'development' ? `${window.location.hostname}:3001` : 'julklappar.herokuapp.com';

export default {
  name: 'app',
  data() {
      return {
          name: '',
          roomId: '',
          socket: io(ioHost),
          gameState: null,
          protocol: window.location.protocol,
          suggestedRoomId: '',
          roomError: ''
      }
  },
  computed: {
    playerInState () {
      return Boolean(
        this.gameState &&
        this.roomId &&
        this.gameState.players.some(player => player.name === this.name)
      );
    }
  },
  methods:{
    handleSetPlayer({ name, roomId }) {
      this.name = name;
      this.roomId = roomId;
      this.roomError = '';
      this.socket.emit('PLAYER_JOIN', {
        name,
        roomId
      });
    },
    changeProtocol(){
      window.location = window.location.href.replace('http:', 'https:')
    }
  },
  components: {
    SelectName,
    GameScreen
  },
  mounted(){
    this.socket.on('ROOM_ID_SUGGESTION', ({ roomId }) => {
      this.suggestedRoomId = roomId;
    });
    this.socket.on('UPDATE_STATE', state => {
      if (state.roomId === this.roomId) {
        this.roomError = '';
        this.gameState = state;
      }
    });
    this.socket.on('ROOM_ERROR', ({ message }) => {
      this.roomError = message;
      this.gameState = null;
    });
  }
}
</script>
<style src='papercss/dist/paper.min.css' />
<style>
.main{
  padding-bottom: 130px !important;
}
h2{
  margin-top: 0;
}
</style>
