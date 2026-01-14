<template>
  <div class="card">
    <header class="card-header">
      <p class="card-header-title">
        {{ strip.name }}
        <span v-if="strip.modifier" class="tag is-info mt-1 ml-2 px-1">modified</span>
      </p>
      <div class="card-header-icon">
        {{ index }}
      </div>
    </header>
    <div class="card-content">
      <div class="content">
        Length: {{ strip.length }} LEDs
      </div>
      <div v-if="controllerLabel" class="content">
        Controller: {{ controllerLabel }}
      </div>
      <div class="content">
        Type:
        <span :class="['ml-1 px-2 py-1 tag is-medium', typeClass[strip.type] || 'is-light']">
          {{ strip.type }}
        </span>
      </div>
    </div>
    <footer class="card-footer">
      <a class="card-footer-item" @click.prevent="$emit('edit', index)">Edit</a>
      <a class="card-footer-item" @click.prevent="$emit('modify', index)">Modifiers</a>
      <a class="card-footer-item" @click.prevent="$emit('delete', index)">Delete</a>
    </footer>
  </div>
</template>

<script>
export default {
  name: "SettingsStripCard",
  props: {
    strip: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    },
    typeClass: {
      type: Object,
      default: () => ( {} )
    },
    controllerLabel: {
      type: String,
      default: ""
    }
  }
}
</script>
