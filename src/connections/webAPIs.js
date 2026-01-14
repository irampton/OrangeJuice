function registerWebAPIs( app, {
	setLEDs,
	turnAllLightsOff,
	getPresets,
	getControllersConfig,
	getScriptGroups,
	getScenes
} ) {
	const apiBasePath = "/api/v1";
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

	function stripListByIndexes( indexes ) {
		const list = buildStripList();
		const resolved = [];
		( indexes || [] ).forEach( value => {
			const index = Number( value );
			if( !Number.isFinite( index ) ) {
				return;
			}
			const entry = list[index];
			if( entry?.id ) {
				resolved.push( entry.id );
			}
		} );
		return resolved;
	}

	function parseIndexInput( input ) {
		if( input === null || input === undefined ) {
			return [];
		}
		if( Array.isArray( input ) ) {
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
					return parsed;
				}
			} catch( e ) {
				return [];
			}
		}
		return text.split( /[,\s|;]+/ ).map( value => value.trim() ).filter( Boolean );
	}

	//web listeners
	app.get( `${apiBasePath}/lightsOff`, ( req, res ) => {
		turnAllLightsOff();
		res.send( 'done' );
	} );
	//preset control (for shortcut)
	app.get( `${apiBasePath}/presets`, ( req, res ) => {
		const presets = getPresets?.() || [];
		res.send( presets.map( p => p.name ) );
	} );
	app.get( `${apiBasePath}/scenes`, ( req, res ) => {
		const scenes = getScenes?.() || [];
		res.send( scenes.map( ( scene, index ) => scene?.name || `Scene ${index}` ) );
	} );
	app.get( `${apiBasePath}/strips`, ( req, res ) => {
		res.send( buildStripList().map( entry => entry.name ) );
	} );
	app.get( `${apiBasePath}/setScene`, ( req, res ) => {
		const index = Number( req.headers?.index ?? req.query?.index ?? req.headers?.scene ?? req.query?.scene );
		if( !Number.isFinite( index ) ) {
			res.status( 400 ).send( "Scene index required" );
			return;
		}
		const scenes = getScenes?.() || [];
		const scene = scenes[index];
		if( !scene ) {
			res.status( 400 ).send( "Scene not found" );
			return;
		}
		const presets = getPresets?.() || [];
		( scene?.rows || [] ).forEach( row => {
			const strips = Array.isArray( row?.strips ) ? row.strips : [];
			if( !strips.length ) {
				return;
			}
			let payload = null;
			if( row.mode === "preset" ) {
				const preset = sanitizePreset( presets?.[row.presetIndex] );
				if( preset ) {
					payload = { ...preset };
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
			setLEDs( {
				...payload,
				strips,
				trigger: "webAPI"
			} );
		} );
		res.send( 'done' );
	} );
	app.get( `${apiBasePath}/setPreset`, ( req, res ) => {
		const index = Number( req.headers?.preset ?? req.query?.preset ?? req.headers?.index ?? req.query?.index );
		const stripInput = req.headers?.strips || req.query?.strips || req.headers?.strip || req.query?.strip;
		const stripIndexes = parseIndexInput( stripInput );
		const stripIds = resolveStripTargets( stripListByIndexes( stripIndexes ) );
		if( !Number.isFinite( index ) ) {
			res.status( 400 ).send( "Preset index required" );
			return;
		}
		if( !stripIds.length ) {
			res.status( 400 ).send( "Strip index list required" );
			return;
		}
		try {
			const presets = getPresets?.() || [];
			const preset = sanitizePreset( presets[index] );
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
