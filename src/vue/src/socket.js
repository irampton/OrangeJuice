let socketInstance;

export function getSocket() {
	if( !socketInstance ) {
		socketInstance = io( window.location.origin );
	}
	return socketInstance;
}
