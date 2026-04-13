
<template>
    <div>
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
                        <input v-model.trim="name" class="input-block" type="text" id="pickName">
                        <br>
                        <label for="roomId">Rumskod:</label>
                        <input v-model="roomId" class="input-block uppercase" type="text" id="roomId" maxlength="4">
                        <br>
                        <p>Fyra tecken. Alla i samma spel ska ange samma kod. Förslag: <strong>{{ normalizedInitialRoomId || 'AB12' }}</strong></p>
                        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
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
    props: {
        initialRoomId: {
            type: String,
            default: ''
        },
        errorMessage: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            name: '',
            roomId: '',
        }
    },
    computed: {
        normalizedInitialRoomId() {
            return (this.initialRoomId || '').toUpperCase();
        }
    },
    watch: {
        initialRoomId: {
            immediate: true,
            handler(newValue) {
                if (!this.roomId) {
                    this.roomId = (newValue || '').toUpperCase();
                }
            }
        },
        roomId(newValue) {
            const normalizedValue = (newValue || '')
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 4);

            if (normalizedValue !== newValue) {
                this.roomId = normalizedValue;
            }
        }
    },
    methods: {
        setName() {
            this.$emit('set-player', {
                name: this.name,
                roomId: this.roomId
            });
        },
    }
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
