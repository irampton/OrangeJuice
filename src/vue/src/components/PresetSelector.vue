<template>
  <h4 class="title is-4">Presets</h4>
  <div class="is-flex is-justify-content-center">
    <BaseDropdown
        :options="presetDropdown"
        color="primary"
        v-model="selectedPreset"
    />
  </div>
  <div class="is-flex is-flex-wrap-wrap is-justify-content-center mt-3">
    <button class="button is-medium is-warning m-2" style="width: 10rem" @click="setPreset">
      Set Preset
    </button>
    <button class="button is-medium is-link m-2" style="width: 10rem" @click="loadPreset">
      Load Preset
    </button>
    <button class="button is-medium is-success m-2" style="width: 10rem" @click="addPreset">
      Add Preset
    </button>
    <button class="button is-medium is-link m-2" style="width: 10rem" @click="updatePreset">
      Update Preset
    </button>
    <button class="button is-medium is-danger m-2" style="width: 10rem" @click="deletePreset">
      Delete Preset
    </button>
  </div>

  <BasePopup name="Preset Name" ref="namePopup" saveText="Add" saveColor="success">
    <BaseTextInput v-model="nameText"/>
  </BasePopup>

  <BasePopup name="Delete Preset" ref="deletePopup" saveText="Delete" saveColor="danger">
    <!--TODO make button delete color -->
    Are you sure you want to to delete {{ this.presets[this.selectedPreset]?.name }}?
  </BasePopup>
</template>

<script>
import BasePopup from "@/components/base/BasePopup.vue";
import BaseTextInput from "@/components/base/BaseTextInput.vue";
import BaseDropdown from "@/components/base/BaseDropdown.vue";

export default {
  name: "PresetSelector",
  components: { BaseDropdown, BaseTextInput, BasePopup },
  props: {
    socket: {
      type: Object,
      require: true
    },
    selectedConfig: {
      type: Object,
      require: true
    },
    selectedPattern: {
      type: Object,
      require: true
    },
    selectedEffect: {
      type: Object,
      require: true
    },
    selectedStrips: {
      type: Object,
      require: true
    }
  },
  data() {
    return {
      nameText: "",
      presets: [],
      selectedPreset: null
    }
  },
  computed: {
    presetDropdown() {
      return this.presets.map( ( p, i ) => ( {
        name: p.name,
        id: i
      } ) );
    }
  },
  methods: {
    setPreset() {
      if ( this.selectedPreset === null ) {
        return;
      }

      this.socket.emit( 'setLEDs', this.presets[this.selectedPreset] );
    },
    loadPreset() {
      if ( this.selectedPreset === null ) {
        return;
      }

      const preset = this.presets[this.selectedPreset];
      this.selectedPattern.id = preset.pattern;
      this.selectedEffect.id = preset.effect || 'none';
      this.selectedStrips.splice( 0, this.selectedStrips.length );
      this.selectedStrips.push( ...preset.strips );
      this.$nextTick( () => {
        this.selectedPattern.options = preset.patternOptions;
        this.selectedEffect.options = preset.effect
            ? preset.effectOptions
            : {};
      } );
    },
    async addPreset() {
      try {
        await this.$refs['namePopup'].open();
        //todo handle no name || strips
        let preset = {
          ...this.selectedConfig,
          trigger: "userPreset",
          name: this.nameText
        };
        this.socket.emit( 'editPresets', 'add', preset );
        this.presets.push( preset );
      } catch ( e ) {
        //popup closed, no action needed
      }
      this.nameText = "";
    },
    updatePreset() {
      if ( this.selectedPreset === null ) {
        return;
      }

      let preset = {
        ...this.selectedConfig,
        trigger: this.presets[this.selectedPreset].trigger,
        name: this.presets[this.selectedPreset].name
      };
      this.socket.emit( 'editPresets', 'update', preset, this.selectedPreset );
      this.presets[this.selectedPreset] = preset;
    },
    deletePreset() {
      if ( this.selectedPreset === null ) {
        return;
      }

      this.$refs['deletePopup'].open().then( () => {
        this.socket.emit( 'editPresets', 'remove', null, this.selectedPreset );
        this.presets.splice( this.selectedPreset, 1 );
      } )
    }
  },
  created() {
    this.socket.emit( 'getPresets', ( data ) => {
      this.presets = data;
    } );
  }
}
</script>

<style scoped>

</style>