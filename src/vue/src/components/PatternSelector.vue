<template>
  <h3 class="title is-4">Pattern</h3>
  <BaseDropdown
      :options="patternOptions"
      v-model="selectedPattern"
      color="danger"
  />
  <div class="block ml-1 mt-3" v-if="patterns?.[selectedPattern]">
    <Option
        v-for="option in selectedOptions"
        :key="option.id"
        :option="option"
    />
  </div>
</template>

<script>
import BaseDropdown from "@/components/base/BaseDropdown.vue";
import Option from "@/components/Option.vue";
import option from "./Option.vue";

export default {
  name: "PatternSelector",
  components: { Option, BaseDropdown },
  props: {
    patterns: {
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
      selectedPattern: "",
      selectedOptions: [],
      noUpdate: false
    }
  },
  computed: {
    patternOptions() {
      if ( this.patterns?.list ) {
        return this.patterns.list.map( id => ( { id, name: this.patterns[id].name } ) );
      } else {
        return [];
      }
    }
  },
  mounted() {
    this.selectedPattern = "off";
  },
  watch: {
    selectedPattern() {
      this.selectedOptions = this.patterns[this.selectedPattern]
          ? this.patterns[this.selectedPattern].options.map( o => ( {
            ...o,
            value: o.default
          } ) )
          : [];
    },
    selectedOptions: {
      deep: true,
      handler() {
        this.noUpdate = true;
        const value = {
          id: this.selectedPattern,
          options: Object.fromEntries( this.selectedOptions.map( o => [ o.id, o.value ] ) )
        };
        this.$emit( 'update:modelValue', value );
        this.$nextTick( () => this.noUpdate = false );
      }
    },
    modelValue: {
      deep: true,
      handler() {
        if ( this.noUpdate || !( this.modelValue.id && this.patterns[this.modelValue.id] ) ) {
          return;
        }
        this.selectedPattern = this.modelValue.id;
        this.selectedOptions = this.patterns[this.selectedPattern].options.map( o => ( {
          ...o,
          value: this.modelValue.options[o.id]
        } ) );
      }
    }
  }
}
</script>