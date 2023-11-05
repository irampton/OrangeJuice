const ChaseEffect = require( "./chase" );
const TwinkleEffect = require( "./twinkle" );
const addedEffects = [ChaseEffect, TwinkleEffect];

const addedEffectOptions = Object.fromEntries( addedEffects.map( e => [e.id, e.options.map( o => {
    return {
        ...o,
        id: `${e.id}_${o.id}`,
        name: `${o.name} (${e.name})`
    }
} )] ) );

module.exports = {
    id: "chase-twinkle",
    name: "Chase Twinkle",
    animate: true,
    options: [
        ...Object.keys( addedEffectOptions ).map( k => addedEffectOptions[k] ).flat(),
        { id: "reverseEffect", name: "Twinkle Chase", type: "checkbox", default: false }
    ],
    Create: function ( colorArray, { reverseEffect, ...options } ) {
        const passedEffectOptions = Object.fromEntries( addedEffects.map( e => [e.id, Object.fromEntries( [...addedEffectOptions[e.id].map( o => [o.id.match( /^.*_(.*)$/ )[1], options[o.id]] ), ["numLEDs", options.numLEDs]] )] ) );
        this.twinkleEffect = new TwinkleEffect.Create( colorArray, passedEffectOptions[TwinkleEffect.id] );
        this.chaseEffectPattern = new ChaseEffect.Create( colorArray, passedEffectOptions[ChaseEffect.id] );
        this.chaseEffectPattern.colorArray = this.twinkleEffect.patternArray;
        this.chaseEffectTimer = new ChaseEffect.Create( colorArray, passedEffectOptions[ChaseEffect.id] );
        this.chaseEffectTimer.colorArray = this.twinkleEffect.timerMap;
        this.steps = this.twinkleEffect.steps;
        this.interval = this.twinkleEffect.interval;
        this.counter = 0;
        this.step = function ( callback ) {
            if ( this.counter % Math.floor( this.steps / this.chaseEffectPattern.speed ) === 0 ) {
                this.chaseEffectPattern.step( ( arr ) => this.twinkleEffect.patternArray = arr );
                if ( reverseEffect ) {
                    this.chaseEffectTimer.colorArray = this.twinkleEffect.timerMap;
                    this.chaseEffectTimer.step( ( arr ) => this.twinkleEffect.timerMap = arr );
                }
            }
            this.twinkleEffect.step( arr => callback( arr ) );
            this.counter++;
        }
    }
};