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
    <div class='pickTicket'>
      <h3>Dra en lott</h3>
      <h4 class="header">Redo</h4>
      <p>
        <span v-for="(player, index) in playersWithNumbers" :key="index" >{{ player.name }}{{index+1 == playersWithNumbers.length ? '' : ', '}}</span>
      </p>
      <h5 class="header">Tips!</h5>
      <p>
        Man kan fortfarande byta lott om man har en muntlig överenskommelse.
      </p>
    </div>
  </div>
  <div class="content" id="content2">
    <Score-Table :players="gameState.players"/>
  </div>
</div>
    <div class="bottom-menu container row">
        <div class="col-12">
          <Button v-if="!playerHasNumber" v-on:click="pickNumber" class="btn-block">Dra en lott</Button>
          <p v-if="playerHasNumber" class="currentNumber">{{thisPlayer.currentNumber}}</p>
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
    pickNumber(){
      console.log(this)
      this.socket.emit('PICK_NUMBER', this.name)
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

