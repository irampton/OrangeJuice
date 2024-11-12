<template>
  <Teleport to="body">
    <div :class="['modal', isOpen ? 'is-active': '']">
      <div class="modal-background" @click="() => internalClose()"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">{{ name }}</p>
          <button class="delete" aria-label="close" @click="() => internalClose()"></button>
        </header>
        <section class="modal-card-body">
          <slot/>
        </section>
        <footer class="modal-card-foot">
          <div class="buttons">
            <button class="button is-success" @click="() => internalClose(true)">{{ saveText }}</button>
            <button class="button" @click="() => internalClose()">Cancel</button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script>
export default {
  name: "BasePopup",
  props: {
    name: {
      type: String,
      default: ""
    },
    saveText: {
      type: String,
      default: "Save"
    },
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isOpen: false,
      resolve: () => {
      },
      reject: () => {
      }
    }
  },
  methods: {
    open() {
      this.isOpen = true;
      return new Promise( ( res, rej ) => {
        this.resolve = res;
        this.reject = rej;
      } )
    },
    internalClose( success = false ) {
      this.isOpen = false;
      if ( success ) {
        this.resolve();
      } else {
        this.reject();
      }
    }
  }
}
</script>

<style scoped>

</style>