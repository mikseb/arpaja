
<template>
  <div class="main" id="app">
    <div class="container">
      <div v-if="!playerInState" class="pre-game">
        <h2>Julklappslotteri</h2>
        <p>En hemmagjord present säger mer än en färdigköpt pryl. Den säger att man använt tid och kraft. Den säger att det är något personligt. Den säger att man får för lite veckopeng.<br><br> - Steen og Stoffer</p>
        <button v-if="protocol === 'http:'" v-on:click="changeProtocol">Gå till https</button>
        <Select-Name @set-name="handleSetName"/>
        <p>Copyright 2022 © Årstadal Web Media Productions</p>
      </div> 
      <div v-if="playerInState">
        <GameScreen :name="name" :socket="socket" :gameState="gameState"/>
      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';
import SelectName from './components/SelectName.vue'
import GameScreen from './components/GameScreen.vue'

const ioHost = process.env.NODE_ENV === 'development' ? 'localhost:3001' : 'julklappar.herokuapp.com';

export default {
  name: 'app',
  data() {
      return {
          name: 'asdf',
          ticketNumber: 0,
          socket: io(ioHost),
          gameState: null,
          protocol: window.location.protocol
      }
  },
  computed: {
    playerInState () {
      return this.gameState && this.gameState.players.some(player => player.name === this.name);
    }
  },
  methods:{
    handleSetName(name) {
      this.name = name;
      this.socket.emit('PLAYER_JOIN', name)
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
    this.socket.on('UPDATE_PLAYERS', (players) => {
      this.players = players;
    });
    this.socket.on('UPDATE_STATE', state => {
      this.gameState = state
    });
    this.$on('V_PICK_NUMBER', data => {
      console.log('picknumber', data)
    })
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

