<template>
  <div :class="['select', colorClass]" style="vertical-align: middle;">
    <select @change="onChange" :value="modelValue">
      <option
          v-for="option in options"
          :key="option.id"
          :value="option.id"
      >
        {{ option.name }}
      </option>
    </select>
  </div>
</template>

<script>
export default {
  name: "BaseDropdown",
  props: {
    // array of options with an id and name
    options: {
      type: Array,
      required: true
    },
    modelValue: {
      type: [ String, Number ],
      required: false
    },
    color: {
      type: String
    }
  },
  data() {
    return {}
  },
  computed: {
    colorClass: function () {
      switch ( this.color ) {
        case 'primary':
        case 'secondary':
        case 'danger':
        case 'info':
        case 'action':
          return `is-${ this.color }`;
        default:
          return "";
      }
    }
  },
  methods: {
    onChange( event ) {
      this.$emit('update:modelValue', event.target.value );
    }
  },
  watch:{
    value(){
      console.log(this.value);
    }
  }
}
</script>