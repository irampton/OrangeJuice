const ChaseEffect = require( "./chase" );
const BreathEffect = require( "./breathe" );
const addedEffects = [ChaseEffect, BreathEffect];

const addedEffectOptions = Object.fromEntries( addedEffects.map( e => [e.id, e.options.map( o => {
    return {
        ...o,
        id: `${e.id}_${o.id}`,
        name: `${o.name} (${e.name})`
    }
} )] ) );

module.exports = {
    id: "chase-breathe",
    name: "Chase Breathe",
    animate: true,
    options: [
        ...Object.keys( addedEffectOptions ).map( k => addedEffectOptions[k] ).flat()
    ],
    Create: function ( colorArray, options ) {
        const passedEffectOptions = Object.fromEntries( addedEffects.map( e => [e.id, Object.fromEntries( [...addedEffectOptions[e.id].map( o => [o.id.match( /^.*_(.*)$/ )[1], options[o.id]] ), ["numLEDs", options.numLEDs]] )] ) );
        this.chaseEffect = new ChaseEffect.Create( colorArray, passedEffectOptions[ChaseEffect.id] );
        this.breathEffect = new BreathEffect.Create( colorArray, passedEffectOptions[BreathEffect.id] );
        this.steps = this.breathEffect.steps;
        this.interval = this.breathEffect.interval;
        this.counter = 0;
        this.step = function ( callback ) {
            if ( this.counter % Math.floor( this.steps / this.chaseEffect.speed ) === 0 ) {
                this.chaseEffect.step( ( arr ) => this.breathEffect.patternArray = this.breathEffect.outputArray = arr );
            }
            this.breathEffect.step( arr => callback( arr ) );
            this.counter++;
        }
    }
};