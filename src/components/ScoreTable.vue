<template>
  <div>
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
          <td>{{ player.currentNumber || "-" }}</td>
          <td>{{ player.name }}</td>
          <td><span class="badge success">{{ player.wins }}</span></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Player } from "@/types";

defineProps<{
  players: Player[];
}>();
</script>
