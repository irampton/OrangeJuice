let script = require("./fade.js");

let fade = new script.Create(["ff0000"], ["8080c0"], {"time": 200});

fade.interval = setInterval(() => {
    fade.step((arr) => {
        console.log(arr[0]);
    })
}, fade.interval);