<template>
  <input
      class="input ml-2"
      type="text"
      :value="modelValue"
      @input="event => $emit('update:modelValue', event.target.value )">
</template>

<script>
export default {
  name: "BaseTextInput",
  props: {
    modelValue: {
      type: String,
      required: false
    }
  }
}
</script>

<style scoped>

</style>