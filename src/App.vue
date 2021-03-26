
<template>
  <div id="app">
    <div class="container">
      <div v-if="!name" class="pre-game">
        <h2>Julpåskklappar</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. </p>
        <Select-Name @set-name="handleSetName"/>
      </div> 
      <div v-if="name">
        <GameScreen :name-="name" :players="players"/>
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
          name: '',
          ticketNumber: 0,
          players: [],
          socket: io(ioHost)
      }
  },
  methods:{
    handleSetName(name) {
      this.name = name;
      this.socket.emit('PLAYER_JOIN', name)
    }
  },
  components: {
    SelectName,
    GameScreen
  },
  mounted(){
    this.socket.on('UPDATE_PLAYERS', (players) => {
      this.players = players;
      console.log(players)

    });
    this.socket.on('PICK_NUMBER', data => {
      if(data.player == this.name){
        this.ticketNumber = data.number
      }
    })
    this.socket.on('UPDATE_STATE', data => {
      if(data.player == this.name){
        this.ticketNumber = data.number
      }
    });
    this.$on('V_PICK_NUMBER', data => {
      console.log('picknumber', data)
    })
  }
}
</script>

<style src='papercss/dist/paper.min.css'></style>
