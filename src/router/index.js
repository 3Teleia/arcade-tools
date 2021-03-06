import Vue from "vue";
import VueRouter from "vue-router";
import Timings from "../views/Timings.vue";
import Credits from "../views/Credits.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Default",
    component: Timings
  },
  {
    path: "/timing",
    name: "Eased timings",
    component: Timings
  },
  {
    path: "/credits",
    name: "Credits",
    component: Credits
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
