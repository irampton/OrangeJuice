import { createApp } from 'vue'
import './assets/style.scss';

//fontawesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCirclePlus, faCircleMinus, faGear } from '@fortawesome/free-solid-svg-icons';

// Add icons to the library
library.add( faCirclePlus, faCircleMinus, faGear  );


import App from './App.vue'

const app = createApp( App )
app.component( 'font-awesome-icon', FontAwesomeIcon );

app.mount( '#app' );
