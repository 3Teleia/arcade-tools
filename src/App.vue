<template>
  <v-app>
    <navigation :links="links"></navigation>
    <v-main>
      <v-container>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import Navigation from "./components/Navigation.vue";

export default {
  name: "App",
  components: { Navigation },

  data: () => {
    return {
      links: [
        { text: "Eased timings", route: "/timing" },
        { text: "Credits", route: "/credits" }
      ]
    };
  }
};
</script>
