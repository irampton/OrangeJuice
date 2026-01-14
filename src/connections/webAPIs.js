function registerWebAPIs( app, {
	setLEDs,
	turnAllLightsOff,
	getUserPresets,
	getControllersConfig,
	getScriptGroups
} ) {
	function sanitizePreset( preset ) {
		if( !preset || typeof preset !== "object" ) {
			return preset;
		}
		const { strips, ...rest } = preset;
		return rest;
	}

	function stripKey( id ) {
		return Array.isArray( id ) ? `${id[0]}:${id[1]}` : "";
	}

	function normalizeStripId( id ) {
		if( !Array.isArray( id ) || id.length < 2 ) {
			return null;
		}
		const [ first, second ] = id;
		if( first === "sharedRender" ) {
			const groupIndex = Number( second );
			if( Number.isFinite( groupIndex ) ) {
				return ["sharedRender", groupIndex];
			}
			return null;
		}
		if( first === "group" ) {
			const groupIndex = Number( second );
			if( Number.isFinite( groupIndex ) ) {
				return ["group", groupIndex];
			}
			return null;
		}
		const controllerIndex = Number( first );
		const stripIndex = Number( second );
		if( !Number.isFinite( controllerIndex ) || !Number.isFinite( stripIndex ) ) {
			return null;
		}
		return [controllerIndex, stripIndex];
	}

	function uniqueStripIds( ids ) {
		const unique = [];
		const seen = new Set();
		( ids || [] ).forEach( id => {
			const normalized = normalizeStripId( id );
			if( !normalized ) {
				return;
			}
			const key = stripKey( normalized );
			if( !key || seen.has( key ) ) {
				return;
			}
			seen.add( key );
			unique.push( normalized );
		} );
		return unique;
	}

	function parseStripToken( token ) {
		if( token === null || token === undefined ) {
			return null;
		}
		const text = String( token ).trim();
		if( !text ) {
			return null;
		}
		if( text.startsWith( "[" ) ) {
			try {
				return JSON.parse( text );
			} catch( e ) {
				return null;
			}
		}
		const delimiter = text.includes( ":" ) ? ":" : ( text.includes( "," ) ? "," : null );
		if( !delimiter ) {
			return null;
		}
		const parts = text.split( delimiter ).map( part => part.trim() ).filter( Boolean );
		if( parts.length !== 2 ) {
			return null;
		}
		const first = parts[0];
		const second = parts[1];
		const firstValue = ( first === "sharedRender" || first === "group" ) ? first : Number( first );
		const secondValue = ( second === "sharedRender" || second === "group" ) ? second : Number( second );
		return [firstValue, secondValue];
	}

	function parseStripInput( input ) {
		if( input === null || input === undefined ) {
			return [];
		}
		if( Array.isArray( input ) ) {
			if( input.length === 2 && !Array.isArray( input[0] ) ) {
				return [input];
			}
			return input;
		}
		const text = String( input ).trim();
		if( !text ) {
			return [];
		}
		if( text.startsWith( "[" ) ) {
			try {
				const parsed = JSON.parse( text );
				if( Array.isArray( parsed ) ) {
					if( parsed.length === 2 && !Array.isArray( parsed[0] ) ) {
						return [parsed];
					}
					return parsed;
				}
			} catch( e ) {
				// ignore
			}
		}
		const tokens = text.split( /[|;]/ ).map( part => part.trim() ).filter( Boolean );
		if( tokens.length > 1 ) {
			return tokens.map( parseStripToken ).filter( Boolean );
		}
		const parsed = parseStripToken( text );
		return parsed ? [parsed] : [];
	}

	function resolveStripTargets( ids ) {
		const scriptGroups = getScriptGroups?.() || [];
		const resolved = [];
		uniqueStripIds( ids ).forEach( id => {
			if( !Array.isArray( id ) ) {
				return;
			}
			if( id[0] === "sharedRender" ) {
				resolved.push( ["sharedRender", Number( id[1] )] );
				return;
			}
			if( id[0] === "group" ) {
				const groupIndex = Number( id[1] );
				const group = scriptGroups?.[groupIndex];
				if( group?.shareRender ) {
					resolved.push( ["sharedRender", groupIndex] );
					return;
				}
				const groupStrips = uniqueStripIds( group?.strips || [] );
				resolved.push( ...groupStrips );
				return;
			}
			const normalized = normalizeStripId( id );
			if( normalized ) {
				resolved.push( normalized );
			}
		} );
		return uniqueStripIds( resolved );
	}

	function buildStripList() {
		const controllers = getControllersConfig?.() || [];
		const strips = [];
		controllers.forEach( ( controller, controllerIndex ) => {
			( controller?.strips || [] ).forEach( ( strip, stripIndex ) => {
				strips.push( {
					name: strip.name || `Strip ${controllerIndex}-${stripIndex}`,
					id: [controllerIndex, stripIndex]
				} );
			} );
		} );
		const groups = ( getScriptGroups?.() || [] ).map( ( group, index ) => ( {
			name: group.name || `Group ${index}`,
			id: group.shareRender ? ["sharedRender", index] : ["group", index]
		} ) );
		return strips.concat( groups );
	}

	//web listeners
	app.get( '/lightsOff', ( req, res ) => {
		turnAllLightsOff();
		res.send( 'done' );
	} );
	//preset control (for shortcut)
	app.get( '/presets', ( req, res ) => {
		const presets = getUserPresets?.() || [];
		res.send( presets.map( p => p.name ) );
	} );
	app.get( '/strips', ( req, res ) => {
		res.send( buildStripList() );
	} );
	app.get( '/setPreset', ( req, res ) => {
		let name = req.headers?.preset || req.query?.preset;
		const stripInput = req.headers?.strip || req.query?.strip || req.headers?.strips || req.query?.strips;
		const stripIds = resolveStripTargets( parseStripInput( stripInput ) );
		if( !stripIds.length ) {
			res.status( 400 ).send( "Strip ID required" );
			return;
		}
		try {
			const presets = getUserPresets?.() || [];
			const preset = sanitizePreset( presets.find( p => p.name === name ) );
			if( !preset ) {
				throw new Error( "Preset not found" );
			}
			const payload = {
				...preset,
				strips: stripIds,
				trigger: "webAPI"
			};
			setLEDs( payload );
			res.send( 'done' );
		} catch( e ) {
			res.status( 400 ).send( "Preset not found" );
		}
	} );
}

module.exports = registerWebAPIs;
