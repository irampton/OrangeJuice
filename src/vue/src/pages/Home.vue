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
      </div>
    </div>
    <button class="button is-primary is-large is-fullwidth" @click="setLEDs">Set Pattern & Effect</button>
    <div class="columns is-mobile is-multiline mt-3">
      <div class="column box is-full">
        <PresetSelector/>
      </div>
      <!-- TODO add matrix selector -->
    </div>
  </section>
</template>

<script>
import PatternSelector from '@/components/PatternSelector.vue';
import EffectSelector from '@/components/EffectSelector.vue';
import StripList from '@/components/StripList.vue';
import PresetSelector from "@/components/PresetSelector.vue";
import { PAGES } from "@/mixins/CONSTANTS.js";

export default {
  name: "Home",
  components: { PresetSelector, StripList, EffectSelector, PatternSelector },
  data() {
    return {
      socket: undefined,
      ledScripts: {},
      ledStripConfig: [],
      selectedPattern: {},
      selectedEffect: {},
      selectedStrips: []
    }
  },
  methods: {
    setLEDs() {
      const isEffect = this.selectedEffect.id !== 'none';
      const ledConfig = {
        "trigger": "website",
        "pattern": this.selectedPattern.id,
        "patternOptions": this.selectedPattern.options,
        "effect": isEffect ? this.selectedEffect.id : undefined,
        "effectOptions": isEffect ? this.selectedEffect.options : undefined,
        "strips": this.selectedStrips
      }
      console.log( JSON.parse( JSON.stringify( ledConfig ) ) );
      this.socket.emit( 'setLEDs', ledConfig );
    }
  },
  mounted() {
    this.socket = io();
    this.socket.on( 'connect', () => {
      this.socket.emit( 'getLEDScripts', ( data ) => {
        this.ledScripts = data;
      } );
      this.socket.emit( 'getStripConfig', ( data ) => {
        this.ledStripConfig = data;
        //todo
      } );
      this.socket.emit( 'getMatrixScripts', ( data ) => {
        //matrixScripts = data;
        //todo
      } );
      this.socket.emit( 'getFeatures', ( data ) => {
        if ( !data.matrixDisplay ) {
          //todo
          //document.getElementById( "matrixSettings" ).classList.add( "noShow" );
        }
      } );
      //drawPresets();
      //todo
    } );
  }
}
</script>