<template>
  <div>
    <v-navigation-drawer
      v-model="drawer"
      fixed
      dark
      app
      :clipped="$vuetify.breakpoint.lgAndUp"
    >
      <v-list nav>
        <v-list-item-group>
          <v-list-item
            v-for="link in links"
            :key="link.text"
            router
            :to="link.route"
          >
            <v-list-item-content>
              <v-list-item-title class="title">{{
                link.text
              }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar
      :clipped-left="$vuetify.breakpoint.lgAndUp"
      color="red"
      dark
      app
      text
      fixed
    >
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
    </v-app-bar>
  </div>
</template>

<script>
export default {
  name: "Navigation",
  props: ["links"],
  data: () => ({
    drawer: null
  })
};
</script>
