module.exports = {
    'id': "fillX",
    'name': "Fill X",
    'options': [
        { 'id': "color1", 'name': "Color #1", 'type': "color", 'default': "000000" },
        { 'id': "color2", 'name': "Color #2", 'type': "color", 'default': "000000" },
        { 'id': "color3", 'name': "Color #3", 'type': "color", 'default': "000000" },
        { 'id': "color4", 'name': "Color #4", 'type': "color", 'default': "000000" },
        { 'id': "color5", 'name': "Color #5", 'type': "color", 'default': "000000" },
        { 'id': "color6", 'name': "Color #6", 'type': "color", 'default': "000000" },
        { 'id': "color7", 'name': "Color #7", 'type': "color", 'default': "000000" },
        { 'id': "color8", 'name': "Color #8", 'type': "color", 'default': "000000" },
        { 'id': "color9", 'name': "Color #9", 'type': "color", 'default': "000000" },
        { 'id': "color10", 'name': "Color #10", 'type': "color", 'default': "000000" },
        { 'id': "color11", 'name': "Color #11", 'type': "color", 'default': "000000" },
        { 'id': "color12", 'name': "Color #12", 'type': "color", 'default': "000000" },
        { 'id': "color13", 'name': "Color #13", 'type': "color", 'default': "000000" },
        { 'id': "color14", 'name': "Color #14", 'type': "color", 'default': "000000" },
        { 'id': "color15", 'name': "Color #15", 'type': "color", 'default': "000000" },
        { 'id': "color16", 'name': "Color #16", 'type': "color", 'default': "000000" },
        { 'id': "num", 'name': "Number to Use", 'type': "number", 'default': "16" }
    ],
    'generate': ( numLEDs, options ) => {
        let arr = [];
        let numberOfLights = Math.max( Math.min( options.num, 16 ), 1 );
        for ( let i = 1; i <= numberOfLights; i++ ) {
            arr.push( options[`color${i}`] );
        }
        while ( arr.length < numLEDs ) {
            arr.push( ...arr );
        }
        return arr;
    }
};