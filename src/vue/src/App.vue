<template>
  <NavBar :currentPage="currentPage"/>
  <div>
    <Home v-if="currentPage === PAGES.home"/>
  </div>
</template>

<script>
import { PAGES } from '@/mixins/CONSTANTS';
import NavBar from '@/components/NavBar.vue';
import Home from '@/pages/Home.vue';

export default {
  components: {
    NavBar,
    Home
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