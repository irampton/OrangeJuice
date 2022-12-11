module.exports = {
    'id': "chase",
    'name': "Chase",
    'animate': true,
    'options': [
        {'id': "reverse", 'name': "Reverse", 'type': "checkbox", 'default': false},
        {'id': "speed", 'name': "Speed", 'type': "number", 'default': 1}
    ],
    "Create": function (colorArray,options) {
        this.colorArray = [...colorArray];
        this.reverse = options.reverse;
        this.speed = options.speed;
        this.timeout = 1 / this.speed * 1000;
        this.step = function (callback) {
            if (this.reverse) {
                this.colorArray.unshift(this.colorArray.pop());
            } else {
                this.colorArray.push(this.colorArray.shift());
            }
            callback(this.colorArray);
        }
    }
};