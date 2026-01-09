<template>
  <aside class="menu">
    <div v-for="group in groups" :key="group.label">
      <p :class="['menu-label', group.colorClass]">{{ group.label }}</p>
      <ul class="menu-list">
        <li v-for="item in group.items" :key="item.id">
          <a @click.prevent="$emit('jump', item.id)">{{ item.label }}</a>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script>
export default {
  name: "SettingsSideNav",
  props: {
    groups: {
      type: Array,
      default: () => []
    }
  }
}
</script>
