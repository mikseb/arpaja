
<template>
  <div class="container">
      <div class="row flex-spaces child-borders">
        <label class="paper-btn margin" for="modal-1">Starta</label>
    </div>
    <input class="modal-state" id="modal-1" type="checkbox">
    <div class="modal">
        <label class="modal-bg" for="modal-1"></label>
        <div class="modal-body">
            <label class="btn-close" for="modal-1">X</label>
            <div class="row">
                <h4 class="modal-title">Innan vi drar igång.</h4>
                <div class="form-group center">
                    <label for="pickName">Ditt namn:</label>
                    <input v-model="name" class="input-block" type="text" id="pickName">
                    <br>
                    <p>Välj något som dina medspelare känner igen. Väljer du samma namn någon annan får ni dela på klapparna</p>
                    <button v-on:click="setName" class="btn-block btn-success">Kör</button>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
export default {
    data() {
        return {
            name: '',
        }
    },
    methods: {
        setName() {
            this.$emit('set-name', this.name);
        },
    }
}
</script>

<style>
</style>