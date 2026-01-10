<template>
  <div class="is-flex is-flex-direction-row is-flex-wrap-wrap">
    <div class="has-text-danger is-size-4 is-align-self-flex-end">
      <FontAwesomeIcon :icon="['fas', 'circle-minus']" @click="removeColor"/>
    </div>
    <div v-for="c in colorArr" :key="c.index">
      <BaseColorInput v-model="c.color"/>
    </div>
    <div class="has-text-success is-size-4 is-align-self-flex-end">
      <FontAwesomeIcon :icon="['fas', 'circle-plus']" @click="addColor"/>
    </div>
  </div>
</template>

<script>
import BaseColorInput from "@/components/base/BaseColorInput.vue";

// fontawesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCirclePlus, faCircleMinus } from '@fortawesome/free-solid-svg-icons';

library.add( faCirclePlus, faCircleMinus );

export default {
  name: "BaseColorArray",
  components: { BaseColorInput, FontAwesomeIcon },
  props: {
    modelValue: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      colorArr: this.modelValue ?? []
    }
  },
  methods: {
    addColor() {
      this.colorArr.push( {
        index: this.colorArr.length,
        color: '#000000'
      } );
    },
    removeColor() {
      if ( this.colorArr.length > 0 ) {
        this.colorArr.splice( 0, 1 );
      }
    }
  },
  created() {
    this.addColor();
  },
  watch: {
    colorArr: {
      deep: true,
      handler() {
        this.$emit( 'update:modelValue', this.colorArr.map( c => c.color ) );
      }
    }
  }
}
</script>