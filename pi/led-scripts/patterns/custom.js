module.exports = {
    id: "custom",
    name: "Custom",
    options: [
        { id: "arr", name: "Array", type: "text", default: [] }
    ],
    hide: true,
    generate: ( numLEDs, { arr } ) => {
        let array = typeof arr === "string" ? JSON.parse(arr) : arr;
        let newArr = [];
        while ( newArr.length < numLEDs ) {
            newArr.push( ...array );
        }
        return newArr;
    }
};