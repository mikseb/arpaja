
<template>
  <div id="app">
    <div class="container">
      <div v-if="!playerInState" class="pre-game">
        <h2>Påsklotteriet</h2>
        <h4>Rekommendationer</h4>
        <p>Om du träffar personer utanför din mindre krets bör ni ses på ett sätt som minskar risken för smittspridning. Umgås utomhus om det går, och håll så stort avstånd som möjligt till varandra. Undvik att vara nära varandra, framförallt på platser där det är trångt om utrymme under en längre tid. <br>- Folkhälsomyndigheten</p>
        <Select-Name @set-name="handleSetName"/>
        <p>Copyright 2021 © Årstadal Web Media Productions</p>
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
    }
  },
  components: {
    SelectName,
    GameScreen
  },
  mounted(){
    this.socket.on('UPDATE_PLAYERS', (players) => {
      //this is some stupid
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

<style src='papercss/dist/paper.min.css'></style>
