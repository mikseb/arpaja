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
            <input id="pickName" v-model.trim="name" class="input-block" type="text" />
            <br />
            <label for="roomId">Rumskod:</label>
            <input
              id="roomId"
              v-model="roomId"
              class="input-block uppercase"
              type="text"
              maxlength="4"
            />
            <br />
            <p>
              Fyra tecken. Alla i samma spel ska ange samma kod. Förslag:
              <strong>{{ normalizedInitialRoomId || "AB12" }}</strong>
            </p>
            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
            <p>
              Välj något som dina medspelare känner igen. Väljer du samma namn
              som någon annan får ni dela på klapparna.
            </p>
            <button class="btn-block btn-success" @click="setPlayer">Kör</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = defineProps<{
  initialRoomId: string;
  errorMessage: string;
}>();

const emit = defineEmits<{
  (event: "set-player", value: { name: string; roomId: string }): void;
}>();

const name = ref("");
const roomId = ref("");

const normalizedInitialRoomId = computed(() => props.initialRoomId.toUpperCase());

watch(
  () => props.initialRoomId,
  (newValue) => {
    if (!roomId.value) {
      roomId.value = newValue.toUpperCase();
    }
  },
  { immediate: true },
);

watch(roomId, (newValue) => {
  const normalizedValue = newValue.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);

  if (normalizedValue !== newValue) {
    roomId.value = normalizedValue;
  }
});

function setPlayer() {
  emit("set-player", {
    name: name.value,
    roomId: roomId.value,
  });
}
</script>

<style>
.uppercase {
  text-transform: uppercase;
}

.error {
  color: #a7342d;
}
</style>
