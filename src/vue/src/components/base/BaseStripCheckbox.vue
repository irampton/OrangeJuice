<template>
  <input :id="id"
         class="stripBox bigger"
         type="checkbox"
         :checked="modelValue"
         :disabled="disabled"
         @change="checked"
  >
  <label class="button py-2 px-3 m-1"
         :class="[labelClass, disabled ? 'is-disabled' : '']"
         :for="id"
         @dblclick="dblClick">
    {{ name }}
  </label>
</template>

<script>
export default {
  name: "BaseStripCheckbox",
  emits: ['change', 'update:modelValue', 'dblclick'],
  props: {
    name: {
      type: String,
      required: true
    },
    modelValue: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    labelClass: {
      type: String,
      default: ""
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
    },
    dblClick() {
      this.$emit( 'dblclick' );
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
.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
