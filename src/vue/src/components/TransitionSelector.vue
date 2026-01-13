<template>
  <div class="transition-selector">
    <button
        v-if="usePopup"
        class="button transition-gear"
        @click="openTransitionModal"
        aria-label="Transition Settings"
    >
      <span class="icon">
        <FontAwesomeIcon :icon="['fas', 'gear']"/>
      </span>
    </button>

    <BasePopup
        v-if="usePopup"
        ref="transitionModal"
        name="Transition Settings"
        save-text="Apply"
        save-color="success"
    >
      <div class="field">
        <label class="label">{{ label }}</label>
        <div class="control">
          <BaseDropdown
              :options="transitionOptionsList"
              v-model="selection.id"
          />
        </div>
      </div>
      <div class="block ml-1 mt-3" v-if="selection.selectedOptions.length">
        <Option
            v-for="option in selection.selectedOptions"
            :key="option.id"
            :option="option"
        />
      </div>
    </BasePopup>

    <div v-else class="transition-selector-inline">
      <div class="field">
        <label class="label">{{ label }}</label>
        <div class="control">
          <BaseDropdown
              :options="transitionOptionsList"
              v-model="selection.id"
          />
        </div>
      </div>
      <div class="block ml-1 mt-3" v-if="selection.selectedOptions.length">
        <Option
            v-for="option in selection.selectedOptions"
            :key="option.id"
            :option="option"
        />
      </div>
    </div>
  </div>
</template>

<script>
import BasePopup from "@/components/base/BasePopup.vue";
import BaseDropdown from "@/components/base/BaseDropdown.vue";
import Option from "@/components/Option.vue";
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';

library.add( faGear );

export default {
  name: "TransitionSelector",
  components: { FontAwesomeIcon, BasePopup, BaseDropdown, Option },
  props: {
    ledScripts: {
      type: Object,
      default: () => ( {} )
    },
    modelValue: {
      type: Object,
      default: () => ( { id: 'none', options: {} } )
    },
    inline: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      default: "Transition"
    }
  },
  emits: ["update:modelValue"],
  data() {
    return {
      selection: {
        id: 'none',
        selectedOptions: []
      },
      ignoreWatch: false
    };
  },
  computed: {
    usePopup() {
      return !this.inline;
    },
    transitionOptionsList() {
      const arr = [
        { id: 'none', name: 'Off' }
      ];
      if( this.ledScripts?.transitions?.list ) {
        arr.push( ...this.ledScripts.transitions.list.map( id => ( {
          id,
          name: this.ledScripts.transitions[id].name
        } ) ) );
      }
      return arr;
    }
  },
  watch: {
    modelValue: {
      handler( nextValue ) {
        if( this.inline ) {
          const nextId = nextValue?.id || 'none';
          const nextOptions = nextValue?.options || {};
          if( nextId === this.selection.id && this.areOptionsEqual( nextOptions ) ) {
            return;
          }
        }
        this.resetFromModel();
      },
      deep: true
    },
    'selection.id': function() {
      if( this.ignoreWatch ) {
        return;
      }
      this.selection.selectedOptions = this.buildTransitionOptions( this.selection.id );
      if( this.inline ) {
        this.emitSelection();
      }
    },
    'selection.selectedOptions': {
      handler() {
        if( this.ignoreWatch || !this.inline ) {
          return;
        }
        this.emitSelection();
      },
      deep: true
    }
  },
  created() {
    this.resetFromModel();
  },
  methods: {
    buildTransitionOptions( transitionId, existingOptions = {} ) {
      if( !this.ledScripts?.transitions?.[transitionId] ) {
        return [];
      }
      return this.ledScripts.transitions[transitionId].options.map( option => ( {
        ...option,
        value: existingOptions[option.id] !== undefined ? existingOptions[option.id] : option.default
      } ) );
    },
    emitSelection() {
      this.$emit( 'update:modelValue', {
        id: this.selection.id,
        options: Object.fromEntries(
            this.selection.selectedOptions.map( option => [option.id, option.value] )
        )
      } );
    },
    areOptionsEqual( nextOptions ) {
      const optionEntries = this.selection.selectedOptions || [];
      const nextKeys = Object.keys( nextOptions || {} );
      if( optionEntries.length !== nextKeys.length ) {
        return false;
      }
      return optionEntries.every( option => nextOptions[option.id] === option.value );
    },
    resetFromModel() {
      this.ignoreWatch = true;
      const nextId = this.modelValue?.id || 'none';
      this.selection.id = nextId;
      this.selection.selectedOptions = this.buildTransitionOptions(
          nextId,
          this.modelValue?.options || {}
      );
      this.$nextTick( () => {
        this.ignoreWatch = false;
      } );
    },
    async openTransitionModal() {
      this.resetFromModel();
      try {
        await this.$refs.transitionModal.open();
        this.emitSelection();
      } catch( e ) {
        return;
      }
    }
  }
}
</script>

<style scoped>
.transition-gear {
  flex: 0 0 auto;
}
</style>
