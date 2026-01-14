import { createRouter, createWebHistory } from 'vue-router';

import Home from '@/pages/Home.vue';
import Settings from '@/pages/Settings.vue';
import LiveView from '@/pages/LiveView.vue';

const routes = [
	{
		path: '/',
		name: 'home',
		component: Home
	},
	{
		path: '/settings',
		name: 'settings',
		component: Settings
	},
	{
		path: '/live-view',
		name: 'live-view',
		component: LiveView
	}
];

const router = createRouter( {
	history: createWebHistory(),
	routes
} );

export default router;
