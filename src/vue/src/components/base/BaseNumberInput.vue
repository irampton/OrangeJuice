<template>
  <input
      class="input ml-2"
      type="number"
      :value="modelValue"
      @input="event => $emit('update:modelValue', Number(event.target.value) )">
</template>

<script>
export default {
  name: "BaseNumberInput",
  props: {
    //todo - add props for min and max
    modelValue: {
      type: Number,
      required: false
    }
  }
}
</script>

<style scoped>

</style>