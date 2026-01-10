<template>
  <div :id="sectionId" :class="sectionClass">
    <slot name="header">
      <h3 v-if="title" class="title is-5">{{ title }}</h3>
    </slot>
    <slot/>
  </div>
</template>

<script>
export default {
  name: "SettingsSection",
  props: {
    sectionId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: ""
    },
    offset: {
      type: Boolean,
      default: true
    },
    extraClass: {
      type: String,
      default: ""
    }
  },
  computed: {
    sectionClass() {
      return [
        'column',
        'box',
        'is-four-fifths-tablet',
        this.offset ? 'is-offset-one-fifth' : '',
        this.extraClass
      ];
    }
  }
}
</script>
