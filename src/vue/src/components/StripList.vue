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
    checkEvent() {
      this.$emit( 'update:modelValue', this.checked.map( ( c, i ) => c ? i : false ).filter( c => c !== false ) );
    }
  },
  watch: {
    stripConfig() {
      this.checked = new Array( this.stripConfig.length ).fill( false );
    },
    modelValue: {
      deep: true,
      handler() {
        this.checked = this.checked.map( ( c, i ) => this.modelValue.includes( i ) );
      }
    }
  }
}
</script>

<style scoped>

</style>