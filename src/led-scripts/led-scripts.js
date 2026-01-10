const fs = require( 'fs' );
const path = require( 'path' );

let scripts = {
	"patterns": {
		'list': []
	},
	"effects": {
		'list': []
	},
	"modifiers": {
		'list': []
	},
	"transitions": {
		'list': []
	}
};
module.exports = scripts;

fs.readdirSync( path.join( __dirname, "patterns" ) ).forEach( ( file ) => {
	if( file.match( /.js$/ ) ) {
		let script = require( path.join( __dirname, "patterns", file ) );
		scripts.patterns[script.id] = script;
		if( !script.hide ) {
			scripts.patterns.list.push( script.id );
		}
	}
} );
scripts.patterns.list.sort( ( a, b ) => scripts.patterns[a].name === "Off" ? -1 : scripts.patterns[a].name.localeCompare( scripts.patterns[b].name, 'en', { sensitivity: 'base' } ) );

fs.readdirSync( path.join( __dirname, "effects" ) ).forEach( ( file ) => {
	if( file.match( /.js$/ ) ) {
		let script = require( path.join( __dirname, "effects", file ) );
		scripts.effects[script.id] = script;
		scripts.effects.list.push( script.id );
	}
} );
scripts.effects.list.sort( ( a, b ) => scripts.effects[a].name.localeCompare( scripts.effects[b].name, 'en', { sensitivity: 'base' } ) );

fs.readdirSync( path.join( __dirname, "modifiers" ) ).forEach( ( file ) => {
	if( file.match( /.js$/ ) ) {
		let script = require( path.join( __dirname, "modifiers", file ) );
		scripts.modifiers[script.id] = script;
		scripts.modifiers.list.push( script.id );
	}
} );

fs.readdirSync( path.join( __dirname, "transitions" ) ).forEach( ( file ) => {
	if( file.match( /.js$/ ) ) {
		let script = require( path.join( __dirname, "transitions", file ) );
		scripts.transitions[script.id] = script;
		scripts.transitions.list.push( script.id );
	}
} );
