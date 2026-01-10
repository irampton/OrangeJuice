<template>
  <nav class="level has-background-info py-2 is-size-5">
    <p class="level-item has-text-centered is-hidden-tablet-only is-hidden-desktop mb-1">
      <a class="title is-size-3 brand py-0 my-0 is-disabled has-text-white-ter has-text-weight-semibold"
         @click="toggleMenu">OrangeJuice</a>
    </p>
    <p :class="['level-item has-text-centered', menuOpen ? '' : 'noMargin']">
      <a :class="['link headerText', menuOpen ? '' : 'noShow']">Live View</a>
    </p>
    <p :class="['level-item has-text-centered', menuOpen ? '' : 'noMargin']">
      <RouterLink
          to="/"
          :class="linkClass()"
          active-class="is-underlined"
          exact-active-class="is-underlined"
      >Control</RouterLink>
    </p>
    <p :class="['level-item has-text-centered is-hidden-mobile', menuOpen ? '' : 'noMargin']">
      <a class="title is-size-3 brand py-4 is-disabled has-text-white-ter has-text-weight-semibold">OrangeJuice</a>
    </p>
    <p :class="['level-item has-text-centered', menuOpen ? '' : 'noMargin']">
      <RouterLink
          to="/settings"
          :class="linkClass()"
          active-class="is-underlined"
      >Settings</RouterLink>
    </p>
    <p :class="['level-item has-text-centered', menuOpen ? '' : 'noMargin']">
      <a href="https://github.com/irampton/OrangeJuice" target="_blank" :class="['link headerText', menuOpen ? '' : 'noShow']">GitHub</a>
    </p>
  </nav>
</template>

<script>
export default {
  name: "NavBar.vue",
  data(){
    return {
      menuOpen: true
    }
  },
  methods: {
    linkClass() {
      return [
        'link',
        'headerText',
        this.menuOpen ? '' : 'noShow'
      ];
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    }
  },
  mounted() {
    this.menuOpen = window.innerWidth > 768;
    window.addEventListener( 'resize', () => {
      this.menuOpen = window.innerWidth > 768;
    } );
  }
}
</script>
