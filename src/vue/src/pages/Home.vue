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
        <StripList :stripConfig="ledStripConfig" v-model="selectedStrips"/>
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
    <button class="button is-primary is-large is-fullwidth" @click="setLEDs">Set Pattern & Effect</button>
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
import BaseTextInput from "@/components/base/BaseTextInput.vue";
import { getSocket } from "@/socket";
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

library.add( faPlus );
export default {
  name: "Home",
  components: { FontAwesomeIcon, BaseTextInput, BaseStripCheckbox, BasePopup, PresetSelector, StripList, EffectSelector, PatternSelector },
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
        editIndex: null
      },
      selectedPattern: {},
      selectedEffect: {},
      selectedStrips: []
    }
  },
  computed: {
    stripGroupButtons() {
      if( !this.ledStripConfig.length ) {
        return [];
      }
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
        ...( this.scriptGroups || [] ).map( ( group, index ) => ( {
          ...group,
          sourceIndex: index
        } ) ),
        {
          name: "+ Group",
          strips: null,
          isAdd: true
        }
      ];
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
        return `${ id[0] }.${ id[1] }`;
      }
      if( Number.isFinite( Number( id ) ) ) {
        const strip = this.ledStripConfig?.[Number( id )];
        if( strip ) {
          return `${ strip.controller }.${ strip.controllerStripIndex }`;
        }
      }
      return "";
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
      const key = this.stripIdKey( stripId );
      if( !key ) {
        return false;
      }
      return ( selectedStrips || [] ).some( entry => this.stripIdKey( entry ) === key );
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
          strips: this.uniqueStripIds( group.strips || [] )
        } ) );
      } );
    },
    async selectStripGroup( group ) {
      if( group?.isAdd ) {
        await this.openStripGroupModal();
        return;
      }
      const next = this.uniqueStripIds( group?.strips || [] );
      if( !next.length ) {
        this.selectedStrips = [];
        return;
      }
      const allSelected = next.every( stripId => this.isStripSelected( this.selectedStrips, stripId ) );
      if( allSelected ) {
        const remaining = ( this.selectedStrips || [] ).filter(
            stripId => !this.isStripSelected( next, stripId )
        );
        this.selectedStrips = this.uniqueStripIds( remaining );
        return;
      }
      this.selectedStrips = next;
    },
    async editStripGroup( group ) {
      if( !group || group.isAdd || group.isBuiltIn ) {
        return;
      }
      await this.openStripGroupModal( group );
    },
    async openStripGroupModal( group = null ) {
      if( group ) {
        this.stripGroupModal = {
          name: group.name || "",
          strips: this.uniqueStripIds( group.strips || [] ),
          editIndex: group.sourceIndex
        };
      } else {
        this.stripGroupModal = {
          name: "",
          strips: this.uniqueStripIds( this.selectedStrips || [] ),
          editIndex: null
        };
      }
      try {
        await this.$refs.stripGroupModal.open();
        const name = this.stripGroupModal.name?.trim();
        if( !name ) {
          return;
        }
        const strips = this.uniqueStripIds( this.stripGroupModal.strips || [] );
        if( this.stripGroupModal.editIndex !== null && this.stripGroupModal.editIndex !== undefined ) {
          this.socket.emit( 'editStripGroup', 'update', { name, strips }, this.stripGroupModal.editIndex );
        } else {
          this.socket.emit( 'editStripGroup', 'add', { name, strips } );
        }
        this.fetchStripGroups();
      } catch ( e ) {
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
      ledConfig.trigger = "website";
      this.socket.emit( 'setLEDs', ledConfig );
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
