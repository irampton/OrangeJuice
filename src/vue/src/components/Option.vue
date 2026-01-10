<template>
  <div v-if="isBasic" class="field is-horizontal">
    <label class="pt-2">{{ option.name }}</label>
    <div class="control">
      <template v-if="option.type === 'number'">
        <BaseNumberInput v-model="option.value"/>
      </template>
      <template v-else-if="option.type === 'color'">
        <BaseColorInput v-model="option.value" />
      </template>
    </div>
  </div>
  <div v-else class="mb-3">
    <div v-if="option.type === 'checkbox'">
      <BaseCheckbox v-model="option.value" :label="option.name"/>
    </div>
    <div v-else-if="option.type === 'select'">
      <span class="mr-2">{{ option.name }}</span>
      <BaseDropdown :options="option.options.map(o => ({...o, id: o.value}))" v-model="option.value"/>
    </div>
    <div v-else-if="option.type === 'colorArray'">
      <BaseColorArray v-model="option.value" />
    </div>
  </div>
</template>

<script>
import BaseNumberInput from "@/components/base/BaseNumberInput.vue";
import BaseCheckbox from "@/components/base/BaseCheckbox.vue";
import BaseColorInput from "@/components/base/BaseColorInput.vue";
import BaseDropdown from "@/components/base/BaseDropdown.vue";
import BaseColorArray from "@/components/base/BaseColorArray.vue";

export default {
  name: "Option",
  components: { BaseColorArray, BaseDropdown, BaseColorInput, BaseCheckbox, BaseNumberInput },
  props: {
    option: {
      type: Object,
      default: {}
    }
  },
  data() {
    return {}
  },
  computed: {
    isBasic() {
      return [ 'color', 'number' ].includes( this.option.type );
      //todo - other basic input types
    }
  }
}
</script>

<style scoped>

</style>