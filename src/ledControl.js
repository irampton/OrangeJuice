let virtualStrips = [];

function newLEDarr( size, color ) {
    let arr = [];
    for ( let i = 0; i < size; i++ ) {
        arr.push( color );
    }
    return arr;
}

function clearStripEffects( strip ) {
    if ( strip.effect ) {
        clearInterval( strip.effectTimout );
        strip.effect = {};
        strip.effectTimout = null;
    }
    if ( strip.transition ) {
        clearInterval( strip.transition.interval );
        strip.transition = null;
    }
}

function blankStrip( strip ) {
    return {
        "id": strip.id,
        "name": strip.name,
        "length": strip.length,
        "controller": strip.controller,
        "arr": newLEDarr( strip.length, "000000" ),
        "trigger": "",
        "effect": {},
        "effectTimout": null,
        "default": strip.default
    };
}

function clearStrip( currentStrip, options = {} ) {
    let oldColorArr = [];
    clearStripEffects( currentStrip );
    if ( options.transition ) {
        oldColorArr = currentStrip.arr;
        if ( oldColorArr.length === 0 ) {
            oldColorArr = newLEDarr( currentStrip.length, "000000" );
        }
    }

    // Clear strip config completely
    Object.assign( currentStrip, blankStrip( currentStrip ) );

    return oldColorArr;
}

function stripIndexTextKey( stripId ) {
    return `${ stripId[0] }.${ stripId[1] }`;
}

function resetVirtualStripSegments( vStrip ) {
    vStrip.segments.forEach( segment => {
        segment.enabled = true;
    } );
}

function markControllersUpdated( stripConfiguration, stripIndex, controllerUpdates ) {
    if ( stripConfiguration?.controllers?.length ) {
        stripConfiguration.controllers.forEach( controller => {
            controllerUpdates[controller] = true;
        } );
        return;
    }
    if ( stripConfiguration?.controller !== undefined ) {
        controllerUpdates[stripConfiguration.controller] = true;
        return;
    }
    if ( Array.isArray( stripIndex ) ) {
        controllerUpdates[stripIndex[0]] = true;
    }
}

function resetVirtualStrips() {
    virtualStrips.forEach( vStrip => clearStripEffects( vStrip ) );
    virtualStrips = [];
}

function buildVirtualStrip( groupIndex, strips, { controllersConfig, currentLEDs } ) {
    const segments = [];
    let totalLength = 0;
    const controllersSet = new Set();

    (strips || []).forEach( ( stripId ) => {
        const controllerIndex = stripId[0];
        const stripIndex = stripId[1];
        const stripConfiguration = controllersConfig?.[controllerIndex]?.strips?.[stripIndex];
        if ( !stripConfiguration ) {
            return;
        }
        const length = stripConfiguration.configuredLength ?? stripConfiguration.length ?? 0;
        segments.push( {
            id: stripId,
            controller: controllerIndex,
            stripIndex,
            offset: totalLength,
            length,
            enabled: true
        } );
        totalLength += length;
        controllersSet.add( controllerIndex );
        const target = currentLEDs?.[controllerIndex]?.[stripIndex];
        if ( target ) {
            clearStripEffects( target );
        }
    } );

    const vStrip = blankStrip( {
        id: [ "sharedRender", groupIndex ],
        name: `Shared ${ groupIndex }`,
        length: totalLength,
        controller: null
    } );

    vStrip.type = "sharedRender";
    vStrip.group = groupIndex;
    vStrip.strips = strips;
    vStrip.segments = segments;
    vStrip.controllers = Array.from( controllersSet );
    vStrip.applyToStrips = ( arr ) => {
        vStrip.segments.forEach( segment => {
            if ( !segment.enabled ) {
                return;
            }
            const colors = arr.slice( segment.offset, segment.offset + segment.length );
            const target = currentLEDs?.[segment.controller]?.[segment.stripIndex];
            if ( target ) {
                target.arr = colors;
                target.trigger = vStrip.trigger || target.trigger;
            }
        } );
    };

    return vStrip;
}

function disableVirtualStripSegments( stripId, keepGroup = null ) {
    const key = stripIndexTextKey( stripId );
    virtualStrips.forEach( ( vStrip ) => {
        if ( keepGroup !== null && vStrip.group === keepGroup ) {
            return;
        }
        let enabledCount = 0;
        vStrip.segments.forEach( segment => {
            if ( stripIndexTextKey( segment.id ) === key ) {
                segment.enabled = false;
            }
            if ( segment.enabled ) {
                enabledCount += 1;
            }
        } );
        if ( enabledCount === 0 ) {
            clearStripEffects( vStrip );
        }
    } );
    virtualStrips = virtualStrips.filter( vStrip => vStrip.segments.some( segment => segment.enabled ) );
}

function writeConfigToStrips( stripIndex, options, {
    currentLEDs,
    controllersConfig,
    ledScripts,
    controllerUpdates,
    maxFps,
    drawLEDs
} ) {
    let currentStrip, oldColorArr, stripConfiguration;

    // Clear any outstanding effects and prep strip
    if ( stripIndex.type === "sharedRender" ) {
        // We're dealing with a virtual strip, we need to set one up

        // Check to see if any virtual strip is already going with the same group (stripIndex.group is equal)
        // If it is, clear and use that strip
        const existingVStrip = virtualStrips.find( vs => vs.group === stripIndex.group );
        if ( existingVStrip ) {
            const existingKeys = (existingVStrip.strips || []).map( stripIndexTextKey ).join( "|" );
            const nextKeys = (stripIndex.strips || []).map( stripIndexTextKey ).join( "|" );
            if ( existingKeys !== nextKeys ) {
                clearStripEffects( existingVStrip );
                virtualStrips = virtualStrips.filter( vStrip => vStrip !== existingVStrip );
                currentStrip = buildVirtualStrip( stripIndex.group, stripIndex.strips, {
                    controllersConfig,
                    currentLEDs
                } );
                virtualStrips.push( currentStrip );
            } else {
                oldColorArr = clearStrip( existingVStrip, options );
                resetVirtualStripSegments( existingVStrip );
                currentStrip = existingVStrip;
            }
        } else {
            // If there isn't an existing virtual strip, create one
            currentStrip = buildVirtualStrip( stripIndex.group, stripIndex.strips, {
                controllersConfig,
                currentLEDs
            } );
            virtualStrips.push( currentStrip );
        }

        currentStrip.segments?.forEach( segment => {
            const target = currentLEDs?.[segment.controller]?.[segment.stripIndex];
            if ( target ) {
                clearStripEffects( target );
            }
        } );
        currentStrip.strips.forEach( stripId => disableVirtualStripSegments( stripId, stripIndex.group ) );

        stripConfiguration = {
            length: currentStrip.length,
            configuredLength: currentStrip.length,
            controllers: currentStrip.controllers
        };
    } else {
        // Normal strip, set and clear
        currentStrip = currentLEDs[stripIndex[0]][stripIndex[1]];
        oldColorArr = clearStrip( currentStrip, options );
        stripConfiguration = controllersConfig[stripIndex[0]].strips[stripIndex[1]];

        // Check to see if this strip was a part of any virtual strips
        // If it is, disable just the strip on the vStrip
        // If there are no enabled parts of the vStrip, clear any intervals and delete it
        disableVirtualStripSegments( stripIndex );
    }

    // Generate pattern
    currentStrip.arr = ledScripts.patterns[options.pattern].generate( stripConfiguration.configuredLength ?? stripConfiguration.length, options.patternOptions );
    //set trigger
    currentStrip.trigger = options.trigger;
    if ( options.transition ) {
        let newColorArr = currentStrip.arr;
        currentStrip.arr = oldColorArr;
        currentStrip.transition = new ledScripts.transitions[options.transition].Create( newColorArr, oldColorArr, options.transitionOptions, maxFps );
        currentStrip.transition.interval = setInterval( () => {
            if ( currentStrip.transition ) {
                currentStrip.transition.step( ( arr ) => {
                    currentStrip.arr = arr;
                    markControllersUpdated( stripConfiguration, stripIndex, controllerUpdates );
                    if ( currentStrip.type === "sharedRender" ) {
                        currentStrip.applyToStrips( currentStrip.arr );
                    }
                    if ( drawLEDs ) {
                        drawLEDs();
                    }
                } )
            }
        }, currentStrip.transition.intervalTime );
    }
    //if there is an effect, apply & set it up
    if ( options.effect ) {
        //create the new effect
        currentStrip.effect = new ledScripts.effects[options.effect].Create(
            currentStrip.arr,
            {
                ...options.effectOptions,
                numLEDs: stripConfiguration.configuredLength ?? stripConfiguration.length
            } );

        // Run the effect once - Needed for effects that completely change the initial pattern
        currentStrip.effect.step( ( arr ) => {
            currentStrip.arr = arr;
        } );

        // Set the effect to run continuously
        currentStrip.effectTimout = setInterval( () => {
            currentStrip.effect.step( ( arr ) => {
                currentStrip.arr = arr;
                markControllersUpdated( stripConfiguration, stripIndex, controllerUpdates );
                if ( currentStrip.type === "sharedRender" ) {
                    currentStrip.applyToStrips( currentStrip.arr );
                }
                if ( drawLEDs ) {
                    drawLEDs();
                }
            } )
        }, currentStrip.effect.interval );
    }
    if ( currentStrip.type === "sharedRender" ) {
        currentStrip.applyToStrips( currentStrip.arr );
    }
}

module.exports = {
    newLEDarr,
    clearStripEffects,
    blankStrip,
    clearStrip,
    stripIndexTextKey,
    resetVirtualStripSegments,
    markControllersUpdated,
    resetVirtualStrips,
    buildVirtualStrip,
    disableVirtualStripSegments,
    writeConfigToStrips
};
