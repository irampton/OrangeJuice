<template>
  <section class="section pt-1">
    <div class="columns is-mobile is-multiline">
      <div class="column box extraSpace">
        <PatternSelector :patterns="ledScripts.patterns" v-model="selectedPattern"/>
      </div>
      <div class="column box">
        <EffectSelector :effects="ledScripts.effects" v-model="selectedEffect"/>
      </div>
      <div class="column box is-full">
        <StripList
            :stripConfig="displayStripConfig"
            :model-value="selectedStrips"
            @update:modelValue="setSelectedStrips"
            @edit="editStripFromList"
        />
        <hr class="my-2" v-if="stripGroupButtons.length">
        <div class="is-flex is-flex-wrap-wrap">
          <button
              v-for="(group, index) in stripGroupButtons"
              :key="`${group.name}-${index}`"
              class="button py-2 px-3 m-1 is-info is-outlined"
              @click="selectStripGroup(group)"
              @dblclick.stop.prevent="editStripGroup(group)"
          >
            <span v-if="!group.isAdd">{{ group.name }}</span>
            <span v-else class="icon">
              <FontAwesomeIcon :icon="['fas', 'plus']"/>
            </span>
          </button>
        </div>
      </div>
    </div>
    <div class="transition-controls">
      <TransitionSelector
          v-model="selectedTransition"
          :led-scripts="ledScripts"
      />
      <button class="button is-primary is-large transition-action" @click="setLEDs">Set Pattern & Effect</button>
    </div>
    <div class="columns is-mobile is-multiline mt-3">
      <div class="column box is-full">
        <PresetSelector
            :selectedConfig="currentConfig"
            :selectedPattern="selectedPattern"
            :selectedEffect="selectedEffect"
            :selectedStrips="selectedStrips"
            :socket="socket"
        />
      </div>
    </div>

    <BasePopup ref="stripGroupModal" :name="stripGroupModalTitle" save-text="Save" save-color="success">
      <div class="field">
        <label class="label">Group Name</label>
        <div class="control">
          <BaseTextInput v-model="stripGroupModal.name"/>
        </div>
      </div>
      <div class="field">
        <label class="label">Strips</label>
        <div class="control is-flex is-flex-wrap-wrap">
          <BaseStripCheckbox
              v-for="(strip, index) in ledStripConfig"
              :key="`${strip.name}-${strip.controller}-${strip.controllerStripIndex}-${index}`"
              :name="strip.name || `Strip ${index}`"
              :model-value="isStripSelected(stripGroupModal.strips, strip.id)"
              @update:modelValue="toggleGroupStrip(strip.id, $event)"
          />
        </div>
      </div>
      <div class="field">
        <div class="control">
          <BaseCheckbox
              v-model="stripGroupModal.shareRender"
              label="Render group as a single strip"
          />
        </div>
      </div>
      <template #footer>
        <button
            v-if="stripGroupModal.editIndex !== null && stripGroupModal.editIndex !== undefined"
            class="button is-danger"
            @click="deleteStripGroup"
        >
          Delete
        </button>
        <button class="button is-success" @click="$refs.stripGroupModal.internalClose(true)">Save</button>
        <button class="button" @click="$refs.stripGroupModal.internalClose()">Cancel</button>
      </template>
    </BasePopup>

  </section>
</template>

<script>
import PatternSelector from '@/components/PatternSelector.vue';
import EffectSelector from '@/components/EffectSelector.vue';
import StripList from '@/components/StripList.vue';
import PresetSelector from "@/components/PresetSelector.vue";
import BasePopup from "@/components/base/BasePopup.vue";
import BaseStripCheckbox from "@/components/base/BaseStripCheckbox.vue";
import BaseCheckbox from "@/components/base/BaseCheckbox.vue";
import BaseTextInput from "@/components/base/BaseTextInput.vue";
import TransitionSelector from "@/components/TransitionSelector.vue";
import { getSocket } from "@/socket";
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

library.add( faPlus );
export default {
  name: "Home",
  components: {
    FontAwesomeIcon,
    TransitionSelector,
    BaseCheckbox,
    BaseTextInput,
    BaseStripCheckbox,
    BasePopup,
    PresetSelector,
    StripList,
    EffectSelector,
    PatternSelector
  },
  data() {
    return {
      socket: undefined,
      socketConnectHandler: undefined,
      ledScripts: {},
      ledStripConfig: [],
      scriptGroups: [],
      stripGroupModal: {
        name: "",
        strips: [],
        editIndex: null,
        shareRender: false
      },
      selectedPattern: {},
      selectedEffect: {},
      selectedStrips: [],
      selectedTransition: {
        id: 'none',
        options: {}
      }
    }
  },
  computed: {
    stripGroupButtons() {
      if( !this.ledStripConfig.length ) {
        return [];
      }
      const groups = ( this.scriptGroups || [] )
          .map( ( group, index ) => ( {
            ...group,
            sourceIndex: index
          } ) )
          .filter( group => !group.shareRender );
      return [
        {
          name: "Select All",
          strips: this.ledStripConfig.map( strip => strip.id ),
          isBuiltIn: true
        },
        {
          name: "Select None",
          strips: [],
          isBuiltIn: true
        },
        ...groups,
        {
          name: "+ Group",
          strips: null,
          isAdd: true
        }
      ];
    },
    sharedRenderGroups() {
      return ( this.scriptGroups || [] )
          .map( ( group, index ) => ( {
            ...group,
            sourceIndex: index
          } ) )
          .filter( group => group.shareRender );
    },
    selectedSharedGroups() {
      return ( this.selectedStrips || [] )
          .filter( stripId => this.isSharedRenderId( stripId ) )
          .map( stripId => this.sharedRenderGroups.find( group => group.sourceIndex === stripId[1] ) )
          .filter( Boolean );
    },
    disabledStripKeys() {
      const keys = new Set();
      this.selectedSharedGroups.forEach( group => {
        ( group.strips || [] ).forEach( stripId => {
          const key = this.stripIdKey( stripId );
          if( key ) {
            keys.add( key );
          }
        } );
      } );
      return keys;
    },
    disabledSharedGroupKeys() {
      const keys = new Set();
      const selectedSharedKeys = new Set(
          this.selectedSharedGroups.map( group => `sharedRender.${group.sourceIndex}` )
      );
      this.sharedRenderGroups.forEach( group => {
        const groupKey = `sharedRender.${group.sourceIndex}`;
        if( selectedSharedKeys.has( groupKey ) ) {
          return;
        }
        const overlaps = ( group.strips || [] )
            .some( stripId => this.disabledStripKeys.has( this.stripIdKey( stripId ) ) );
        if( overlaps ) {
          keys.add( groupKey );
        }
      } );
      return keys;
    },
    displayStripConfig() {
      const baseStrips = this.ledStripConfig.map( strip => ( {
        ...strip,
        disabled: this.disabledStripKeys.has( this.stripIdKey( strip.id ) )
      } ) );
      const sharedStrips = this.sharedRenderGroups.map( group => ( {
        id: ["sharedRender", group.sourceIndex],
        name: group.name || `Group ${group.sourceIndex}`,
        shareRender: true,
        disabled: this.disabledSharedGroupKeys.has( `sharedRender.${group.sourceIndex}` ),
        labelClass: "shared-render-label"
      } ) );
      return baseStrips.concat( sharedStrips );
    },
    stripGroupModalTitle() {
      if( this.stripGroupModal.editIndex !== null && this.stripGroupModal.editIndex !== undefined ) {
        return "Edit Strip Group";
      }
      return "New Strip Group";
    },
    currentConfig() {
      const isEffect = this.selectedEffect.id !== 'none';
      return {
        "pattern": this.selectedPattern.id,
        "patternOptions": this.selectedPattern.options,
        "effect": isEffect ? this.selectedEffect.id : undefined,
        "effectOptions": isEffect ? this.selectedEffect.options : undefined,
        "strips": this.selectedStrips
      }
    }
  },
  methods: {
    buildStripConfig( controllers ) {
      const strips = [];
      ( controllers || [] ).forEach( ( controller, controllerIndex ) => {
        ( controller.strips || [] ).forEach( ( strip, stripIndex ) => {
          strips.push( {
            ...strip,
            id: [controllerIndex, stripIndex],
            controller: controllerIndex,
            controllerStripIndex: stripIndex
          } );
        } );
      } );
      return strips;
    },
    stripIdKey( id ) {
      if( Array.isArray( id ) ) {
        if( id[0] === "sharedRender" ) {
          return `sharedRender.${id[1]}`;
        }
        return `${id[0]}.${id[1]}`;
      }
      if( Number.isFinite( Number( id ) ) ) {
        const strip = this.ledStripConfig?.[Number( id )];
        if( strip ) {
          return `${strip.controller}.${strip.controllerStripIndex}`;
        }
      }
      return "";
    },
    selectionKey( id ) {
      return this.stripIdKey( id );
    },
    isSharedRenderId( id ) {
      return Array.isArray( id ) && id[0] === "sharedRender";
    },
    normalizeStripId( id ) {
      if( Array.isArray( id ) ) {
        const controllerIndex = Number( id[0] );
        const stripIndex = Number( id[1] );
        if( Number.isFinite( controllerIndex ) && Number.isFinite( stripIndex ) ) {
          return [controllerIndex, stripIndex];
        }
      }
      const flatIndex = Number( id );
      if( Number.isFinite( flatIndex ) ) {
        const strip = this.ledStripConfig?.[flatIndex];
        if( strip ) {
          return [strip.controller, strip.controllerStripIndex];
        }
      }
      return null;
    },
    uniqueStripIds( ids ) {
      const unique = [];
      const seen = new Set();
      ( ids || [] ).forEach( value => {
        const normalized = this.normalizeStripId( value );
        if( !normalized ) {
          return;
        }
        const key = this.stripIdKey( normalized );
        if( !key || seen.has( key ) ) {
          return;
        }
        seen.add( key );
        unique.push( normalized );
      } );
      return unique;
    },
    isStripSelected( selectedStrips, stripId ) {
      const key = this.selectionKey( stripId );
      if( !key ) {
        return false;
      }
      return ( selectedStrips || [] ).some( entry => this.selectionKey( entry ) === key );
    },
    toggleGroupStrip( stripId, enabled ) {
      const strips = ( this.stripGroupModal.strips || [] ).slice();
      const key = this.stripIdKey( stripId );
      const index = strips.findIndex( entry => this.stripIdKey( entry ) === key );
      if( enabled && index === -1 ) {
        strips.push( stripId );
      }
      if( !enabled && index !== -1 ) {
        strips.splice( index, 1 );
      }
      this.stripGroupModal.strips = strips;
    },
    fetchStripGroups() {
      this.socket.emit( 'getStripGroups', ( data ) => {
        const groups = Array.isArray( data ) ? data : [];
        this.scriptGroups = groups.map( group => ( {
          ...group,
          strips: this.uniqueStripIds( group.strips || [] ),
          shareRender: Boolean( group.shareRender )
        } ) );
      } );
    },
    normalizeSelection( selected ) {
      const normalized = [];
      ( selected || [] ).forEach( entry => {
        if( this.isSharedRenderId( entry ) ) {
          normalized.push( ["sharedRender", entry[1]] );
          return;
        }
        const strip = this.normalizeStripId( entry );
        if( strip ) {
          normalized.push( strip );
        }
      } );
      return normalized;
    },
    setSelectedStrips( selected ) {
      const next = this.normalizeSelection( selected );
      const resolved = [];
      const prevKeys = new Set( ( this.selectedStrips || [] ).map( item => this.selectionKey( item ) ) );
      const nextKeys = new Set( next.map( item => this.selectionKey( item ) ) );
      const addedSharedKeys = new Set(
          [...nextKeys]
              .filter( key => !prevKeys.has( key ) && key.startsWith( "sharedRender." ) )
      );

      const sharedEntries = next
          .filter( entry => this.isSharedRenderId( entry ) )
          .map( entry => {
            const group = this.sharedRenderGroups.find( item => item.sourceIndex === entry[1] );
            if( !group ) {
              return null;
            }
            return {
              id: ["sharedRender", group.sourceIndex],
              key: `sharedRender.${group.sourceIndex}`,
              group
            };
          } )
          .filter( Boolean );

      const selectedSharedStripKeys = new Set();
      const addSharedGroup = ( entry ) => {
        const groupKeys = ( entry.group.strips || [] )
            .map( stripId => this.stripIdKey( stripId ) )
            .filter( Boolean );
        const overlaps = groupKeys.some( key => selectedSharedStripKeys.has( key ) );
        if( overlaps ) {
          return;
        }
        resolved.push( entry.id );
        groupKeys.forEach( key => selectedSharedStripKeys.add( key ) );
      };

      sharedEntries.forEach( entry => {
        if( addedSharedKeys.has( entry.key ) ) {
          addSharedGroup( entry );
        }
      } );
      sharedEntries.forEach( entry => {
        if( addedSharedKeys.has( entry.key ) ) {
          return;
        }
        addSharedGroup( entry );
      } );

      next.forEach( entry => {
        if( this.isSharedRenderId( entry ) ) {
          return;
        }
        const key = this.stripIdKey( entry );
        if( !key || selectedSharedStripKeys.has( key ) ) {
          return;
        }
        if( resolved.some( item => this.selectionKey( item ) === key ) ) {
          return;
        }
        resolved.push( entry );
      } );
      this.selectedStrips = resolved;
    },
    async selectStripGroup( group ) {
      if( group?.isAdd ) {
        await this.openStripGroupModal();
        return;
      }
      const next = this.uniqueStripIds( group?.strips || [] );
      if( !next.length ) {
        this.setSelectedStrips( [] );
        return;
      }
      const allSelected = next.every( stripId => this.isStripSelected( this.selectedStrips, stripId ) );
      if( allSelected ) {
        const remaining = ( this.selectedStrips || [] ).filter(
            stripId => !this.isStripSelected( next, stripId )
        );
        this.setSelectedStrips( this.uniqueStripIds( remaining ) );
        return;
      }
      this.setSelectedStrips( next );
    },
    async editStripGroup( group ) {
      if( !group || group.isAdd || group.isBuiltIn ) {
        return;
      }
      await this.openStripGroupModal( group );
    },
    async editStripFromList( strip ) {
      if( !strip?.shareRender ) {
        return;
      }
      const group = this.sharedRenderGroups.find( item => item.sourceIndex === strip.id?.[1] );
      if( group ) {
        await this.openStripGroupModal( group );
      }
    },
    async openStripGroupModal( group = null ) {
      if( group ) {
        this.stripGroupModal = {
          name: group.name || "",
          strips: this.uniqueStripIds( group.strips || [] ),
          editIndex: group.sourceIndex,
          shareRender: Boolean( group.shareRender )
        };
      } else {
        this.stripGroupModal = {
          name: "",
          strips: this.uniqueStripIds( this.selectedStrips || [] ),
          editIndex: null,
          shareRender: false
        };
      }
      try {
        await this.$refs.stripGroupModal.open();
        const name = this.stripGroupModal.name?.trim();
        if( !name ) {
          return;
        }
        const strips = this.uniqueStripIds( this.stripGroupModal.strips || [] );
        const shareRender = Boolean( this.stripGroupModal.shareRender );
        if( this.stripGroupModal.editIndex !== null && this.stripGroupModal.editIndex !== undefined ) {
          this.socket.emit( 'editStripGroup', 'update', { name, strips, shareRender }, this.stripGroupModal.editIndex );
        } else {
          this.socket.emit( 'editStripGroup', 'add', { name, strips, shareRender } );
        }
        this.fetchStripGroups();
      } catch( e ) {
        return;
      }
    },
    deleteStripGroup() {
      const index = this.stripGroupModal.editIndex;
      if( index === null || index === undefined ) {
        return;
      }
      if( !window.confirm( "Delete this group?" ) ) {
        return;
      }
      this.socket.emit( 'editStripGroup', 'remove', index );
      this.fetchStripGroups();
      this.$refs.stripGroupModal.internalClose();
    },
    setLEDs() {
      const ledConfig = JSON.parse( JSON.stringify( this.currentConfig ) );
      const selectionSnapshot = JSON.parse( JSON.stringify( this.selectedStrips || [] ) );
      if( this.selectedTransition?.id && this.selectedTransition.id !== 'none' ) {
        ledConfig.transition = this.selectedTransition.id;
        ledConfig.transitionOptions = this.selectedTransition.options;
      }
      ledConfig.trigger = "website";
      this.socket.emit( 'setLEDs', ledConfig );
      this.$nextTick( () => {
        this.setSelectedStrips( selectionSnapshot );
      } );
    }
  },
  created() {
    this.socket = getSocket();
    this.socketConnectHandler = () => {
      this.socket.emit( 'getLEDScripts', ( data ) => {
        this.ledScripts = data;
      } );
      this.socket.emit( 'getSettings', ( data ) => {
        this.ledStripConfig = this.buildStripConfig( data?.controllers );
      } );
      this.fetchStripGroups();
    };
    this.socket.on( 'connect', this.socketConnectHandler );
    if( this.socket.connected ) {
      this.socketConnectHandler();
    }
  },
  beforeUnmount() {
    if( this.socket && this.socketConnectHandler ) {
      this.socket.off( 'connect', this.socketConnectHandler );
    }
  }
}
</script>

<style scoped>
.shared-render-label {
  border: 1px solid rgba(30, 60, 120, 0.35);
  color: #1b3f6b;
  background-color: transparent;
}

.transition-controls {
  display: flex;
  gap: 0.5rem;
}

.transition-action {
  flex: 1 1 auto;
}
</style>
