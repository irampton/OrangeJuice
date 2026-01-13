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
      colorArr: []
    }
  },
  methods: {
    normalizeColors( colors ) {
      return ( colors || [] ).map( ( color, index ) => {
        if( typeof color === 'object' && color !== null && 'color' in color ) {
          return {
            index: Number.isFinite( color.index ) ? color.index : index,
            color: color.color || '#000000'
          };
        }
        return {
          index,
          color: typeof color === 'string' ? color : '#000000'
        };
      } );
    },
    currentColors() {
      return this.colorArr.map( c => c.color );
    },
    addColor() {
      this.colorArr.push( {
        index: this.colorArr.length,
        color: '#000000'
      } );
    },
    removeColor() {
      if( this.colorArr.length > 0 ) {
        this.colorArr.splice( 0, 1 );
      }
    }
  },
  created() {
    this.colorArr = this.normalizeColors( this.modelValue );
    if( this.colorArr.length === 0 ) {
      this.addColor();
    }
  },
  watch: {
    modelValue: {
      deep: true,
      handler( value ) {
        const incoming = ( value || [] ).map( c => ( typeof c === 'string' ? c : c?.color ) );
        const current = this.currentColors();
        if( JSON.stringify( incoming ) === JSON.stringify( current ) ) {
          return;
        }
        this.colorArr = this.normalizeColors( value );
        if( this.colorArr.length === 0 ) {
          this.addColor();
        }
      }
    },
    colorArr: {
      deep: true,
      handler() {
        this.$emit( 'update:modelValue', this.currentColors() );
      }
    }
  }
}
</script>
