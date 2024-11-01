<template>
  <input
      class="big m-1 ml-4 mr-2"
      type="color"
      :value="modelValue"
      :title="modelValue"
      @input="event => $emit('update:modelValue', event.target.value )">
</template>

<script>
export default {
  name: "BaseColorInput",
  props: {
    modelValue: {
      type: [Number, String],
      required: false
    }
  }
}
</script>

<style scoped>

</style>