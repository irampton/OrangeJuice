export const HELPER = {
    colorClass: function (color) {
        switch ( color ) {
            case 'primary':
            case 'secondary':
            case 'danger':
            case 'info':
            case 'action':
            case 'success':
                return `is-${ color }`;
            default:
                return "";
        }
    }
}