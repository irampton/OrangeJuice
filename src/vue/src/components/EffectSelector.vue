<template>
  <h3 class="title is-4">Effect</h3>
  <BaseDropdown
      :options="effectsOptions"
      v-model="selectedEffect"
      color="danger"
  />
  <div class="block ml-1 mt-3" v-if="effects?.[selectedEffect]">
    <Option
        v-for="option in selectedOptions"
        :key="option.id"
        :option="option"
    />
  </div>
</template>

<script>
import Option from "@/components/Option.vue";
import BaseDropdown from "@/components/base/BaseDropdown.vue";

export default {
  name: "EffectSelector",
  components: { Option, BaseDropdown },
  props: {
    effects: {
      type: Object,
      default: () => ( {} )
    },
    modelValue: {
      type: Object,
      default: () => {
        return {
          id: "",
          options: {}
        }
      }
    }
  },
  data() {
    return {
      selectedEffect: "",
      selectedOptions: []
    }
  },
  computed: {
    effectsOptions() {
      let arr = [
        {
          id: 'none',
          name: 'None'
        }
      ];
      if ( this.effects?.list ) {
        arr.push( ...this.effects.list.map( id => ( { id, name: this.effects[id].name } ) ) );
      }
      return arr;
    }
  },
  mounted() {
    this.selectedEffect = "none";
  },
  watch: {
    selectedEffect() {
      this.selectedOptions = this.effects[this.selectedEffect]
          ? this.effects[this.selectedEffect].options.map( o => ( {
            ...o,
            value: o.default
          } ) )
          : [];
    },
    selectedOptions: {
      deep: true,
      handler() {
        const value = {
          id: this.selectedEffect,
          options: Object.fromEntries( this.selectedOptions.map( o => [ o.id, o.value ] ) )
        };
        this.$emit( 'update:modelValue', value );
      }
    }
  }
}
</script>

<style scoped>

</style>