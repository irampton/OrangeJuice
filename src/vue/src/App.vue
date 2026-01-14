<template>
  <div>
    <NavBar/>
    <RouterView/>
  </div>
</template>

<script>
import NavBar from '@/components/NavBar.vue';
import { RouterView } from 'vue-router';

export default {
  components: {
    NavBar,
    RouterView
  },
  watch: {
    $route: {
      immediate: true,
      handler( to ) {
        const isLiveView = to?.name === "live-view" || to?.path === "/live-view";
        document.body.classList.toggle( "live-view-background", isLiveView );
      }
    }
  },
  beforeUnmount() {
    document.body.classList.remove( "live-view-background" );
  }
}
</script>

<style>
body.live-view-background {
  background-color: #000;
}
</style>
