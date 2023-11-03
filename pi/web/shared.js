function generateInput( option, superText, addClass ) {
    switch ( option.type ) {
        case "checkbox":
            return `<div class="block ml-2">
                        <label class="checkbox" for="${ superText }-${ option.id }">
                           <input id="${ superText }-${ option.id }" name="${ superText }-${ option.id }" type="checkbox" class="${ addClass ?? "big" }" ${ option.default ? "checked" : "" }>
                           ${ option.name }
                        </label>
                    </div>`;
        case "color":
            return `<div class="field is-horizontal">
                        <label class="pt-3">${ option.name }</label>
                        <input id="${ superText }-${ option.id }" type="${ option.type }" value="${ option.default }" class="big m-2 ml-3">
                    </div>`;
        case "select":
            return `<div class="mb-3">
                        <span>${ option.name }</span>
                        <div class="select ${ addClass }" style="vertical-align: middle;">
                            <select id="${ superText }-${ option.id }">
                                ${ option.options.map( o => `<option value="${ o.value }" ${ o.value === option.default ? "selected" : "" }>${ o.name }</option>` ).join( "\n" ) }
                            </select>
                        </div>
                    </div>`;
        case "colorArray":
            let html = `<div class="mb-3">
                            <p>${ option.name }</p>
                            <span onclick="removeFromColorArray('${ superText }-${ option.id }')" class="tag is-danger is-rounded">-</span>
                            <span id="${ superText }-${ option.id }">
                                ${ option.default.map( ( v, index ) => getColorArrayElement( `${ superText }-${ option.id }-${ index }`, v ) ).join( "\n" ) }
                            </span>
                            <span onclick="addToColorArray('${ superText }-${ option.id }')" class="tag is-success is-rounded">+</span>
                       </div>`;

            return html;
        default:
            return `<div class="field is-horizontal">
                        <label class="pt-2">${ option.name }</label>
                        <div class="control">
                            <input id="${ superText }-${ option.id }" type="${ option.type }" value="${ option.default }" class="input ml-2">
                        </div>
                    </div>`;
    }
}

function properCase( string ) {
    return string.charAt( 0 ).toUpperCase() + string.slice( 1 ).toLowerCase();
}

function addToColorArray( id, color ) {
    let arrHolder = document.getElementById( id );
    let span = document.createElement( "span" );
    span.innerHTML += getColorArrayElement( `${ id }-${ arrHolder.children.length }`, color )
    arrHolder.appendChild( span );
}

function getColorArrayElement( id, color ) {
    return `<input id="${ id }" style="vertical-align: middle" type="color" value="#${ color ?? "000000" }" class="big m-2 ml-3">`;
}

function removeFromColorArray( id ) {
    let arrHolder = document.getElementById( id );
    arrHolder.children[arrHolder.children.length - 1].remove();
}

let menuOn = window.innerWidth > 768;

function toggleMenu(){
    menuOn = !menuOn;
    updateMenu();
}


function updateMenu(){
    if(menuOn){
        for(let item of document.getElementsByClassName('headerText')){
            item.classList.remove('noShow');
            item.parentElement.classList.remove('noMargin');
        }
    }else{
        for(let item of document.getElementsByClassName('headerText')){
            item.classList.add('noShow');
            item.parentElement.classList.add('noMargin');
        }
    }
}
updateMenu();

window.addEventListener('resize', function(event) {
    menuOn = window.innerWidth > 768;
    updateMenu();
}, true);