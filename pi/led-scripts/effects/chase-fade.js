const ChaseEffect = require( "./chase" );
const FadeEffect = require( "./fade" );
const addedEffects = [ ChaseEffect, FadeEffect ];


const addedEffectOptions = Object.fromEntries( addedEffects.map( e => [ e.id, e.options.map( o => {
    return {
        ...o,
        id: `${ e.id }_${ o.id }`,
        name: `${ o.name } (${ e.name })`
    }
} ) ] ) );

module.exports = {
    'id': "chase-fade",
    'name': "Chase Fade",
    'animate': true,
    'options': [
        ...Object.keys( addedEffectOptions ).map( k => addedEffectOptions[k] ).flat()
    ],
    "Create": function ( colorArray, options ) {
        const passedEffectOptions = Object.fromEntries( addedEffects.map( e => [ e.id, Object.fromEntries( [ ...addedEffectOptions[e.id].map( o => [ o.id.match( /^.*_(.*)$/ )[1], options[o.id] ] ), [ "numLEDs", options.numLEDs ] ] ) ] ) );
        this.chaseEffect = new ChaseEffect.Create( colorArray, passedEffectOptions[ChaseEffect.id] );
        this.fadeEffect = new FadeEffect.Create( colorArray, passedEffectOptions[FadeEffect.id] );
        this.steps = this.fadeEffect.steps;
        this.interval = this.fadeEffect.interval;
        this.counter = 0;
        this.step = function ( callback ) {
            if ( this.counter % Math.floor( this.steps / this.chaseEffect.speed ) === 0 ) {
                this.chaseEffect.step( ( arr ) => this.fadeEffect.patternArray = arr );
            }
            this.fadeEffect.step( arr => callback( arr ) );
            this.counter++;
        }
    }
};