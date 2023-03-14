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

fs.readdir(path.join(__dirname, "patterns"), (err, files) => {
    files.forEach((file) => {
        if (file.match(/.js$/)) {
            let script = require(path.join(__dirname, "patterns",file));
            scripts.patterns[script.id] = script;
            if(!script.hide) {
                scripts.patterns.list.push(script.id);
            }
        }
    })
});

fs.readdir(path.join(__dirname, "effects"), (err, files) => {
    files.forEach((file) => {
        if (file.match(/.js$/)) {
            let script = require(path.join(__dirname, "effects",file));
            scripts.effects[script.id] = script;
            scripts.effects.list.push(script.id);
        }
    })
});

fs.readdir(path.join(__dirname, "modifiers"), (err, files) => {
    files.forEach((file) => {
        if (file.match(/.js$/)) {
            let script = require(path.join(__dirname, "modifiers",file));
            scripts.modifiers[script.id] = script;
            scripts.modifiers.list.push(script.id);
        }
    })
});

fs.readdir(path.join(__dirname, "transitions"), (err, files) => {
    files.forEach((file) => {
        if (file.match(/.js$/)) {
            let script = require(path.join(__dirname, "transitions",file));
            scripts.transitions[script.id] = script;
            scripts.transitions.list.push(script.id);
        }
    })
});