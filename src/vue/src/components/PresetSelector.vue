<template>
  <h4 class="title is-4">Presets</h4>
  <div class="is-flex is-justify-content-center">
    <div class="select is-link">
      <select id="presetSelect">
      </select>
    </div>
  </div>
  <div class="is-flex is-flex-wrap-wrap is-justify-content-center mt-3">
    <button class="button is-medium is-warning m-2" style="width: 10rem" onclick="setPreset()">Set Preset
    </button>
    <button class="button is-medium is-link m-2" style="width: 10rem" onclick="loadPreset()">Load
      Preset
    </button>
    <button class="button is-medium is-success m-2" style="width: 10rem" onclick="addPreset()">Add Preset
    </button>
    <button class="button is-medium is-link m-2" style="width: 10rem" onclick="updatePreset()">Update
      Preset
    </button>
    <button class="button is-medium is-danger m-2" style="width: 10rem" onclick="deletePreset()">Delete
      Preset
    </button>
  </div>
</template>

<script>
export default {
  name: "PresetSelector"
}
</script>

<style scoped>

</style>