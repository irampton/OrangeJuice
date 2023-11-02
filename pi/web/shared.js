function generateInput( option, superText, addClass ) {
    switch ( option.type ) {
        case "checkbox":
            return `<div class="block ml-2">
                        <label class="checkbox" for="${superText}-${option.id}">
                           <input id="${superText}-${option.id}" name="${superText}-${option.id}" type="checkbox" class="${addClass ?? "big"}" ${option.default ? "checked" : ""}>
                           ${option.name}
                        </label>
                    </div>`;
        case "color":
            return `<div class="field is-horizontal">
                        <label class="pt-3">${option.name}</label>
                        <input id="${superText}-${option.id}" type="${option.type}" value="${option.default}" class="big m-2 ml-3">
                    </div>`;
        case "select":
            return `<div class="mb-3">
                        <span>${option.name}</span>
                        <div class="select ${addClass}" style="vertical-align: middle;">
                            <select id="${superText}-${option.id}">
                                ${option.options.map( o => `<option value="${o.value}" ${o.value === option.default ? "selected" : ""}>${o.name}</option>`).join("\n")}
                            </select>
                        </div>
                    </div>`;
        default:
            return `<div class="field is-horizontal">
                        <label class="pt-2">${option.name}</label>
                        <div class="control">
                            <input id="${superText}-${option.id}" type="${option.type}" value="${option.default}" class="input ml-2">
                        </div>
                    </div>`;
    }
}

function properCase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}