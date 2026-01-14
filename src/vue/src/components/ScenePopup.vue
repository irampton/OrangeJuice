<template>
  <BasePopup ref="popup" :name="popupTitle" save-text="Save" save-color="success">
    <div class="field">
      <label class="label">Scene Name</label>
      <div class="control">
        <BaseTextInput v-model="sceneName"/>
      </div>
    </div>

    <div v-for="(row, rowIndex) in rows" :key="row.id" class="box scene-row">
      <div class="scene-row-header">
        <div class="buttons has-addons">
          <button
              class="button"
              :class="row.mode === 'preset' ? 'is-link' : ''"
              @click="setRowMode(rowIndex, 'preset')"
          >
            Preset
          </button>
          <button
              class="button"
              :class="row.mode === 'manual' ? 'is-link' : ''"
              @click="setRowMode(rowIndex, 'manual')"
          >
            Manual
          </button>
        </div>
        <button
            v-if="rows.length > 1"
            class="button is-small is-danger is-light"
            @click="removeRow(rowIndex)"
        >
          Remove
        </button>
      </div>

      <div v-if="row.mode === 'preset'" class="field">
        <label class="label">Preset</label>
        <BaseDropdown
            :options="presetOptions"
            v-model="row.presetIndex"
            color="warning"
        />
      </div>

      <div v-else class="manual-section">
        <div class="manual-header">
          <div v-if="row.manualCollapsed" class="manual-summary">
            <span>{{ manualSummary(row) }}</span>
          </div>
          <button class="button is-small is-light manual-toggle" @click="toggleManual(rowIndex)">
            <span class="icon is-small">
              <FontAwesomeIcon :icon="['fas', row.manualCollapsed ? 'chevron-down' : 'chevron-up']"/>
            </span>
          </button>
        </div>
        <div v-if="!row.manualCollapsed" class="manual-editors">
          <PatternSelector :patterns="ledScripts.patterns" v-model="row.pattern"/>
          <EffectSelector :effects="ledScripts.effects" v-model="row.effect"/>
        </div>
      </div>

      <div class="field">
        <label class="label">Strips</label>
        <div class="control is-flex is-flex-wrap-wrap">
          <BaseStripCheckbox
              v-for="(strip, stripIndex) in stripConfig"
              :key="`${strip.name}-${stripIndex}`"
              :name="strip.name || `Strip ${stripIndex}`"
              :label-class="strip.labelClass"
              :model-value="isStripSelected(row, strip.id)"
              @update:modelValue="toggleRowStrip(rowIndex, strip.id, $event)"
          />
        </div>
      </div>
    </div>

    <div class="has-text-centered">
      <button class="button is-link is-light" @click="addRow">
        <span class="icon is-small">
          <FontAwesomeIcon :icon="['fas', 'plus']"/>
        </span>
        <span>Add Layer</span>
      </button>
    </div>
  </BasePopup>
</template>

<script>
import BasePopup from "@/components/base/BasePopup.vue";
import BaseTextInput from "@/components/base/BaseTextInput.vue";
import BaseDropdown from "@/components/base/BaseDropdown.vue";
import BaseStripCheckbox from "@/components/base/BaseStripCheckbox.vue";
import PatternSelector from "@/components/PatternSelector.vue";
import EffectSelector from "@/components/EffectSelector.vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faPlus, faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";

library.add( faPlus, faChevronDown, faChevronUp );

export default {
  name: "ScenePopup",
  components: {
    BasePopup,
    BaseTextInput,
    BaseDropdown,
    BaseStripCheckbox,
    PatternSelector,
    EffectSelector,
    FontAwesomeIcon
  },
  props: {
    presets: {
      type: Array,
      default: () => []
    },
    stripConfig: {
      type: Array,
      default: () => []
    },
    ledScripts: {
      type: Object,
      default: () => ( {} )
    }
  },
  data() {
    return {
      sceneName: "",
      rows: [],
      editIndex: null
    }
  },
  computed: {
    presetOptions() {
      return ( this.presets || [] ).map( ( preset, index ) => ( {
        id: index,
        name: preset?.name || `Preset ${index}`
      } ) );
    },
    popupTitle() {
      return this.editIndex === null || this.editIndex === undefined
          ? "Create Scene"
          : "Edit Scene";
    }
  },
  methods: {
    open( scene = null, index = null ) {
      this.editIndex = index;
      this.sceneName = scene?.name || "";
      const rows = Array.isArray( scene?.rows ) ? scene.rows : [];
      this.rows = rows.length ? rows.map( row => this.normalizeRow( row ) ) : [this.defaultRow()];
      return this.$refs.popup.open().then( () => this.buildScene() );
    },
    defaultRow() {
      return {
        id: `row-${Date.now()}-${Math.random().toString( 16 ).slice( 2 )}`,
        mode: "preset",
        presetIndex: null,
        pattern: {
          id: "off",
          options: {}
        },
        effect: {
          id: "none",
          options: {}
        },
        manualCollapsed: false,
        strips: []
      };
    },
    normalizeRow( row ) {
      const next = this.defaultRow();
      if( row && typeof row === "object" ) {
        next.mode = row.mode === "manual" ? "manual" : "preset";
        next.presetIndex = Number.isFinite( Number( row.presetIndex ) ) ? Number( row.presetIndex ) : null;
        next.pattern = row.pattern && row.pattern.id ? row.pattern : next.pattern;
        next.effect = row.effect && row.effect.id ? row.effect : next.effect;
        next.strips = Array.isArray( row.strips ) ? row.strips.slice() : [];
        next.manualCollapsed = Boolean( row.manualCollapsed );
      }
      return next;
    },
    buildScene() {
      const trimmedName = this.sceneName?.trim();
      const rows = ( this.rows || [] ).map( row => ( {
        mode: row.mode,
        presetIndex: row.presetIndex,
        pattern: row.pattern,
        effect: row.effect,
        strips: this.uniqueStripIds( row.strips || [] ),
        manualCollapsed: row.manualCollapsed
      } ) ).filter( row => row.strips.length );
      return {
        name: trimmedName,
        rows
      };
    },
    setRowMode( rowIndex, mode ) {
      const row = this.rows[rowIndex];
      if( row ) {
        row.mode = mode;
      }
    },
    toggleManual( rowIndex ) {
      const row = this.rows[rowIndex];
      if( row ) {
        row.manualCollapsed = !row.manualCollapsed;
      }
    },
    addRow() {
      this.rows.push( this.defaultRow() );
    },
    removeRow( rowIndex ) {
      this.rows.splice( rowIndex, 1 );
    },
    stripIdKey( id ) {
      if( Array.isArray( id ) ) {
        return `${id[0]}.${id[1]}`;
      }
      return `${id}`;
    },
    uniqueStripIds( ids ) {
      const unique = [];
      const seen = new Set();
      ( ids || [] ).forEach( id => {
        const key = this.stripIdKey( id );
        if( !key || seen.has( key ) ) {
          return;
        }
        seen.add( key );
        unique.push( id );
      } );
      return unique;
    },
    isStripSelected( row, stripId ) {
      const key = this.stripIdKey( stripId );
      return ( row?.strips || [] ).some( id => this.stripIdKey( id ) === key );
    },
    toggleRowStrip( rowIndex, stripId, enabled ) {
      const key = this.stripIdKey( stripId );
      this.rows.forEach( ( row, index ) => {
        if( !row ) {
          return;
        }
        const next = ( row.strips || [] ).slice();
        const existingIndex = next.findIndex( id => this.stripIdKey( id ) === key );
        if( index !== rowIndex && existingIndex !== -1 ) {
          next.splice( existingIndex, 1 );
        } else if( index === rowIndex ) {
          if( enabled && existingIndex === -1 ) {
            next.push( stripId );
          } else if( !enabled && existingIndex !== -1 ) {
            next.splice( existingIndex, 1 );
          }
        }
        row.strips = this.uniqueStripIds( next );
      } );
    },
    manualSummary( row ) {
      const patternName = this.ledScripts?.patterns?.[row?.pattern?.id]?.name || row?.pattern?.id || "Pattern";
      const effectName = row?.effect?.id && row.effect.id !== "none"
          ? ( this.ledScripts?.effects?.[row.effect.id]?.name || row.effect.id )
          : "No Effect";
      return `${patternName} / ${effectName}`;
    }
  }
}
</script>

<style scoped>
.scene-row {
  margin-bottom: 1rem;
}

.scene-row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.manual-section {
  margin-bottom: 0.75rem;
}

.manual-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  justify-content: space-between;
}

.manual-summary {
  font-weight: 600;
  color: #4a4a4a;
}

.manual-editors {
  display: grid;
  gap: 1rem;
}

.manual-toggle {
  margin-left: auto;
}

.manual-editors :deep(.select)::after {
  display: none;
}

.manual-editors :deep(.select select) {
  padding-right: 0.75rem;
}
</style>
