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
      <a :class="['link headerText', menuOpen ? '' : 'noShow']">Control</a>
    </p>
    <p :class="['level-item has-text-centered is-hidden-mobile', menuOpen ? '' : 'noMargin']">
      <a class="title is-size-3 brand py-4 is-disabled has-text-white-ter has-text-weight-semibold">OrangeJuice</a>
    </p>
    <p :class="['level-item has-text-centered', menuOpen ? '' : 'noMargin']">
      <a :class="['link headerText', menuOpen ? '' : 'noShow']">Settings</a>
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
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    }
  }
}
</script>