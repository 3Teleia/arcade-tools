import Vue from "vue";
import VueRouter from "vue-router";
import Timings from "../views/Timings.vue";
import Credits from "../views/Credits.vue";
import SplitArcs from "../views/SplitArcs";
import ArcToAff from "../views/ArcToAff";
import AffToArc from "../views/AffToArc";

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
    path: "/splitarcs",
    name: "Split arcs",
    component: SplitArcs
  },
  {
    path: "/arctoaff",
    name: ".arc -> .aff",
    component: ArcToAff
  },
  {
    path: "/afftoarc",
    name: ".aff -> .arc",
    component: AffToArc
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
