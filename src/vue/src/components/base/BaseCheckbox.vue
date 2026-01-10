<template>
  <div class="block ml-2">
    <label class="checkbox">
      <input
          class="big"
          type="checkbox"
          :checked="modelValue"
          @change="event => $emit('update:modelValue', event.target.checked)"
      />
      {{ label }}
    </label>
  </div>
</template>

<script>
export default {
  name: "BaseCheckbox",
  props: {
    label: {
      type: String,
      default: ""
    },
    modelValue: {
      type: Boolean,
      required: true
    }
  }
}
</script>