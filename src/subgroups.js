module.exports = function ( initalArr, config ) {
    let arr = [];
    config.subgroups.forEach( subgroup => {
        switch ( subgroup.mode ) {
            case "follow":
                for ( let i = 0; i < subgroup.length; i++ ) {
                    arr.push( initalArr[i % initalArr.length] );
                }
                break;
            case "single":
                let color = initalArr[subgroup.index >= 0 ? subgroup.index : (config.configuredLength + subgroup.index)];
                for ( let i = 0; i < subgroup.length; i++ ) {
                    arr.push( color );
                }
                break;
            case "scale":
                for ( let i = 0; i < initalArr.length; i += initalArr.length / subgroup.length ) {
                    arr.push( initalArr[Math.floor( i )] );
                }
                break;
        }
    } );
    return arr;
}