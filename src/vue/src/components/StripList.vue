<template>
  <h4 class="title is-4">Strips</h4>
  <div id="stripsCheckboxes" class="is-flex is-flex-wrap-wrap">
  </div>
  <hr class="my-2" id="stripGroupsHR">
  <div id="stripGroups" class="is-flex is-flex-wrap-wrap">
    <BaseStripCheckbox
        v-for="(strip, i) in stripConfig"
        :key="i"
        :name="strip.name"
        v-model="checked[i]"
        @change="checkEvent"/>
  </div>
</template>

<script>
import BaseStripCheckbox from "@/components/base/BaseStripCheckbox.vue";

export default {
  name: "StripList",
  components: { BaseStripCheckbox },
  props: {
    stripConfig: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: Array,
      required: () => []
    }
  },
  data() {
    return {
      checked: []
    }
  },
  methods: {
    stripIdKey( id ) {
      if ( Array.isArray( id ) ) {
        return `${ id[0] }.${ id[1] }`;
      }
      return `${ id }`;
    },
    stripKeyForIndex( strip, index ) {
      return this.stripIdKey( strip?.id ?? index );
    },
    checkEvent() {
      const selected = this.checked
          .map( ( checked, index ) => checked ? ( this.stripConfig[index]?.id ?? index ) : false )
          .filter( value => value !== false );
      this.$emit( 'update:modelValue', selected );
    }
  },
  watch: {
    stripConfig() {
      this.checked = new Array( this.stripConfig.length ).fill( false );
    },
    modelValue: {
      deep: true,
      handler() {
        const selectedKeys = new Set( ( this.modelValue || [] ).map( id => this.stripIdKey( id ) ) );
        this.checked = this.checked.map( ( c, i ) => selectedKeys.has( this.stripKeyForIndex( this.stripConfig[i], i ) ) );
      }
    }
  }
}
</script>

<style scoped>

</style>
