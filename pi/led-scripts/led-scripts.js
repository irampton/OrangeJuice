const fs = require('fs');
const path = require('path');

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

fs.readdir(path.join(__dirname,"led-scripts","patterns"), (err, files) => {
    files.forEach((file) => {
        if (file.match(/.js$/)) {
            let script = require(`./led-scripts/patterns/${file}`);
            scripts.patterns[script.id] = script;
            scripts.patterns.list.push(script.id);
        }
    })
});

fs.readdir(path.join(__dirname,"led-scripts","effects"), (err, files) => {
    files.forEach((file) => {
        if (file.match(/.js$/)) {
            let script = require(`./led-scripts/effects/${file}`);
            scripts.effects[script.id] = script;
            scripts.effects.list.push(script.id);
        }
    })
});

fs.readdir(path.join(__dirname,"led-scripts","modifiers"), (err, files) => {
    files.forEach((file) => {
        if (file.match(/.js$/)) {
            let script = require(`./led-scripts/modifiers/${file}`);
            scripts.modifiers[script.id] = script;
            scripts.modifiers.list.push(script.id);
        }
    })
});

fs.readdir(path.join(__dirname,"led-scripts","transitions"), (err, files) => {
    files.forEach((file) => {
        if (file.match(/.js$/)) {
            let script = require(`./led-scripts/transitions/${file}`);
            scripts.transitions[script.id] = script;
            scripts.transitions.list.push(script.id);
        }
    })
});