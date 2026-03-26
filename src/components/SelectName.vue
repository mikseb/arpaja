<template>
  <div>
    <div class="row flex-spaces child-borders">
      <label class="paper-btn margin" for="modal-1">Starta</label>
    </div>
    <input id="modal-1" class="modal-state" type="checkbox" />
    <div class="modal">
      <label class="modal-bg" for="modal-1"></label>
      <div class="modal-body">
        <label class="btn-close" for="modal-1">X</label>
        <div class="row">
          <h4 class="modal-title">Innan vi drar igång.</h4>
          <div class="form-group center">
            <label for="pickName">Ditt namn:</label>
            <input id="pickName" v-model="name" class="input-block" type="text" />
            <br />
            <p>
              Välj något som dina medspelare känner igen. Väljer du samma namn
              som någon annan får ni dela på klapparna.
            </p>
            <button class="btn-block btn-success" @click="setName">Kör</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  (event: "set-name", value: string): void;
}>();

const name = ref("");

function setName() {
  emit("set-name", name.value);
}
</script>
