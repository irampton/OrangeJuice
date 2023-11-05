module.exports = {
    id: "custom",
    name: "Custom",
    options: [
        { id: "arr", name: "Array", type: "text", default: [] }
    ],
    hide: true,
    generate: ( numLEDs, { arr } ) => {
        let newArr = [];
        while ( newArr.length < numLEDs ) {
            newArr.push( ...arr );
        }
        return newArr;
    }
};