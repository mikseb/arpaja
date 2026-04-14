<template>
      <div class="">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Namn</th>
            <th>Vunna paket</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(player, index) in players" :key="index">
            <td>{{player.currentNumber || '-'}}</td>
            <td>{{player.name}}</td>
            <td><span class="badge success">{{player.wins}}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
</template>

<script>
export default {
  name: 'ScoreTable',
  props: ['players'],
  data () {
    return {
      dataPlayers: this.players
    }
  }
}
</script>

