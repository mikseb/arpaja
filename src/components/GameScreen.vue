<template>
  <div>
    <div>
      
      <p>
        <span class="latest-winner-title">Senaste vinst</span><br>
        <span class="latest-winner-name">#4 Mikko</span>

      </p>
    </div>
    <div class="row flex-spaces tabs">
  <input id="tab1" type="radio" name="tabs" checked>
  <label for="tab1">Lotteri</label>

  <input id="tab2" type="radio" name="tabs">
  <label for="tab2">Poängställning</label>

  <div class="content" id="content1">
    <h2>Dags för en ny dragning </h2>
    <p>
      Man kan fortfarande byta nummer om man har en muntlig överenskommelse.
    </p>
  </div>
  <div class="content" id="content2">
    <Score-Table :players="players"/>
  </div>
</div>
    <div class="bottom-menu container row">
        <div class="progress margin-bottom">
          <div class="bar" style="width:10%">1</div>
        </div>
        <div class="col-12"><Button v-on:click="$emit('V_PICK_NUMBER', 'asdf')" class="btn-block disabled">Dra en lott</Button></div>
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
  props: ['players'],
  data () {
    return {
      someData: 'asdf',
      update: 'asd'
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
</style>

