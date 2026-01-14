<template>
  <div class="scene-card">
    <h4 class="title is-4">Scenes</h4>
    <div v-if="!scenes.length" class="scene-empty">No scenes yet.</div>
    <div v-else class="scene-list">
      <div v-for="(scene, index) in scenes" :key="`${scene.name}-${index}`" class="scene-item box">
        <button class="button is-success is-light scene-power" @click="activateScene(scene)">
          <span class="icon">
            <FontAwesomeIcon :icon="['fas', 'power-off']"/>
          </span>
        </button>
        <div class="scene-name">{{ scene.name || `Scene ${index}` }}</div>
        <button class="button is-light scene-edit" @click="editScene(scene, index)">
          <span class="icon">
            <FontAwesomeIcon :icon="['fas', 'cog']"/>
          </span>
        </button>
      </div>
    </div>

    <div class="has-text-centered mt-4">
      <button class="button is-link is-light" @click="createScene">
        <span class="icon is-small">
          <FontAwesomeIcon :icon="['fas', 'plus']"/>
        </span>
        <span>Create Scene</span>
      </button>
    </div>

    <ScenePopup
        ref="scenePopup"
        :presets="presets"
        :strip-config="stripConfig"
        :led-scripts="ledScripts"
    />
  </div>
</template>

<script>
import ScenePopup from "@/components/ScenePopup.vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faPowerOff, faCog, faPlus } from "@fortawesome/free-solid-svg-icons";

library.add( faPowerOff, faCog, faPlus );

export default {
  name: "SceneSelector",
  components: {
    ScenePopup,
    FontAwesomeIcon
  },
  props: {
    socket: {
      type: Object,
      required: true
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
      scenes: [],
      presets: []
    }
  },
  methods: {
    async createScene() {
      try {
        const scene = await this.$refs.scenePopup.open();
        if( !scene?.name || !scene?.rows?.length ) {
          return;
        }
        this.socket.emit( 'editScenes', 'add', scene );
        this.scenes.push( scene );
      } catch( e ) {
        // popup dismissed
      }
    },
    async editScene( scene, index ) {
      try {
        const nextScene = await this.$refs.scenePopup.open( scene, index );
        if( !nextScene?.name || !nextScene?.rows?.length ) {
          return;
        }
        this.socket.emit( 'editScenes', 'update', nextScene, index );
        this.scenes.splice( index, 1, nextScene );
      } catch( e ) {
        // popup dismissed
      }
    },
    activateScene( scene ) {
      const rows = Array.isArray( scene?.rows ) ? scene.rows : [];
      rows.forEach( row => {
        const strips = Array.isArray( row?.strips ) ? row.strips : [];
        if( !strips.length ) {
          return;
        }
        let payload = null;
        if( row.mode === "preset" ) {
          const preset = this.presets?.[row.presetIndex];
          if( preset ) {
            payload = {
              ...preset
            };
          }
        } else if( row?.pattern?.id ) {
          payload = {
            pattern: row.pattern.id,
            patternOptions: row.pattern.options || {}
          };
          if( row.effect?.id && row.effect.id !== "none" ) {
            payload.effect = row.effect.id;
            payload.effectOptions = row.effect.options || {};
          }
        }
        if( !payload ) {
          return;
        }
        this.socket.emit( 'setLEDs', {
          ...payload,
          strips,
          trigger: "scene"
        } );
      } );
    }
  },
  created() {
    this.socket.emit( 'getScenes', ( data ) => {
      this.scenes = Array.isArray( data ) ? data : [];
    } );
    this.socket.emit( 'getPresets', ( data ) => {
      this.presets = Array.isArray( data ) ? data : [];
    } );
  }
}
</script>

<style scoped>
.scene-card {
  width: 100%;
}

.scene-list {
  display: grid;
  gap: 0.25rem;
}

.scene-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
}

.scene-power {
  align-self: center;
}

.scene-name {
  font-size: 1.1rem;
  font-weight: 600;
}

.scene-edit {
  margin-left: auto;
}

.scene-empty {
  text-align: center;
  color: #7a7a7a;
  margin-bottom: 1rem;
}
</style>
