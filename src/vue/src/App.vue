<template>
  <NavBar :currentPage="currentPage" @navigate="currentPage = $event"/>
  <div>
    <Home v-if="currentPage === PAGES.home"/>
    <Settings v-else-if="currentPage === PAGES.settings"/>
  </div>
</template>

<script>
import { PAGES } from '@/mixins/CONSTANTS';
import NavBar from '@/components/NavBar.vue';
import Home from '@/pages/Home.vue';
import Settings from '@/pages/Settings.vue';

export default {
  components: {
    NavBar,
    Home,
    Settings
  },
  data() {
    return {
      PAGES,
      currentPage: PAGES.home,
      ledScripts: {}
    }
  }
}
</script>
