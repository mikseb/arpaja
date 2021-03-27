<template>
  <div>
    <div>
      <p>
        <span class="latest-winner-title">Senaste vinst</span><br>
        <span class="latest-winner-name">Nummer {{gameState.lastWinner.number}} {{gameState.lastWinner.name}}</span>
      </p>
    </div>
    <div class="row flex-spaces tabs">
  <input id="tab1" type="radio" name="tabs" checked>
  <label for="tab1">Lotteri</label>

  <input id="tab2" type="radio" name="tabs">
  <label for="tab2">Tävlande</label>

  <div class="content" id="content1">
    <div v-if="gameState.state === 'PICK_TICKET'" class='pickTicket'>
      <h3>Dra en lott</h3>
      <p>När alla spelare har dragit en lott, kommer en vinnare dras</p>
      <h4 class="header">Spelare med lott:</h4>
      <p>
        <span v-for="(player, index) in playersWithNumbers" :key="index" >{{ player.name }}{{index+1 == playersWithNumbers.length ? '' : ', '}}</span>
      </p>
      <h5 class="header">Tips!</h5>
      <p>
        Man kan fortfarande byta lott om man har en muntlig överenskommelse.
      </p>
    </div>
    <div v-if="gameState.state === 'DRAW_WINNER'" class='pickTicket'>
      <h3>Och vinnaren är...</h3>
      <p>Trumvirvel..</p>
    </div>
    <div v-if="gameState.state === 'WINNER_ANNOUNCED'" class='pickTicket'>
      <h3>Lottnumber: {{gameState.lastWinner.number}}</h3>
      <h4>{{gameState.lastWinner.name}} kan gå och hämta sitt paket</h4>
      <p>Glöm inte att lämna tillbaka din lott..</p>
    </div>
  </div>
  <div class="content" id="content2">
    <Score-Table :players="gameState.players"/>
  </div>
</div>
    <div class="bottom-menu container row">
        <div class="col-12">
          <Button v-if="!playerHasNumber && this.gameState.state === 'PICK_TICKET'" v-on:click="pickTicket" class="btn-block">Dra en lott</Button>
          <p v-if="playerHasNumber && gameState.state !== 'WINNER_ANNOUNCED'" class="currentNumber">{{thisPlayer.currentNumber}}</p>
          <Button v-if="playerHasNumber && gameState.state === 'WINNER_ANNOUNCED'" v-on:click="returnTicket" class="btn-block">Lämna tillbaka lott</Button>
        </div>
        <div class="progress margin-bottom">
          <div class="bar" :style="`width:${ticketBarWidth}%`"></div>
        </div>
    </div>
  </div>
</template>
<script>
import ScoreTable from './ScoreTable.vue'


export default {
  name: 'GameScreen',
  components: {
    ScoreTable
  },
  props: ['name', 'socket', 'gameState'],
  data () {
    return {
      someData: 'asdf',
      update: 'asd'
    }
  },
  computed:{
    players(){
      return this.gameState && this.gameState.players || [];
    },
    thisPlayer(){
      return this.gameState && this.gameState.players.filter(player => player.name == this.name)[0] || {};
    },
    playersWithNumbers(){
      return this.players.filter(player => {return player.currentNumber > 0}) || [];
    },
    playerHasNumber() {
      return this.players.some(player => player.name == this.name && player.currentNumber)
    },
    ticketBarWidth(){
      const playersTotal = this.gameState && this.gameState.players.length || 0;
      const numbersLeft = this. gameState && this.gameState.numbersLeft;
      console.log(this.playerHasNumber)
      return  Math.floor((numbersLeft / playersTotal) * 100);
    }
  },
  methods:{
    pickTicket(){
      if(this.gameState.state === 'PICK_TICKET'){
        this.socket.emit('PICK_NUMBER', this.name)
      }
    },
    returnTicket(){
      if(this.gameState.state === 'WINNER_ANNOUNCED'){
        this.socket.emit('RETURN_NUMBER', this.name)
      }
    }
  }
}
</script>

<style>
  .bottom-menu{
    position: fixed !important;
    bottom: 0;
    height: 130px;
  }
  .latest-winner-title{
    font-size: 24px
  }
  .latest-winner-name{
    font-size: 36px
  }
  .header{
    margin-bottom: 8px;
  }
  .currentNumber{
    text-align: center;
    font-size: 48px;
    margin: 0;
  }
</style>

