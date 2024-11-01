<template>
  <input :id="id"
         class="stripBox bigger"
         type="checkbox"
         :checked="modelValue"
         @change="checked"
  >
  <label class="button py-2 px-3 m-1"
         :for="id">
    {{ name }}
  </label>
</template>

<script>
export default {
  name: "BaseStripCheckbox",
  emits: ['change', 'update:modelValue'],
  props: {
    name: {
      type: String,
      required: true
    },
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      id: undefined
    }
  },
  methods: {
    checked( event ) {
      this.$emit( 'update:modelValue', event.target.checked );
      this.$emit( 'change' );
    }
  },
  created() {
    if ( !window.stripCheckboxCount ) {
      window.stripCheckboxCount = 0;
    }
    this.id = `stripCheckbox-${ window.stripCheckboxCount }`;
    window.stripCheckboxCount++;
  }
}
</script>

<style scoped>

</style>