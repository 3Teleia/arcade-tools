<template>
  <v-container>
    <v-row>
      <v-col cols="5">
        <v-form>
          <v-row>
            <v-textarea label="Input" v-model="input"></v-textarea>
          </v-row>
          <v-row>
            <v-col cols="2">
              <v-text-field
                label="Segments"
                v-model="segments"
                required
                type="number"
                min="1"
                :rules="number_rules"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-overflow-btn
            v-if="use_additional"
            dense
            menu-props="top"
            label="Select easing type for X"
            :items="additional_type_list"
            v-model="ease_type_x"
          ></v-overflow-btn>

          <v-overflow-btn
            v-if="use_additional"
            dense
            menu-props="top"
            label="Select easing type for Y"
            :items="additional_type_list"
            v-model="ease_type_y"
          ></v-overflow-btn>

          <v-checkbox
            v-model="use_additional"
            label="Use custom easings"
          ></v-checkbox>
          <v-checkbox
            v-model="height_lines"
            label="Force every segment to have a height line"
          ></v-checkbox>
          <v-checkbox
            v-model="ignore_traces"
            label="Ignore traces"
          ></v-checkbox>
          <v-checkbox
            v-if="ignore_traces"
            v-model="output_ignored_traces"
            label="Output ignored traces with split arcs"
          ></v-checkbox>
          <v-checkbox
            v-model="arcs_separated"
            label="Make every 2nd arc a trace"
          ></v-checkbox>

          <v-btn
            :loading="loading"
            block
            depressed
            tile
            color="blue"
            @click="split_arcs"
          >
            Split arcs
          </v-btn>
        </v-form>
      </v-col>
      <v-col cols="7">
        <v-textarea
          v-if="resulting_list"
          v-model="resulting_list"
          label="Output"
        ></v-textarea>
        <v-btn
          block
          depressed
          tile
          color="blue"
          @click="copy_list"
          v-if="resulting_list"
        >
          Copy list to clipboard
        </v-btn>
        <v-snackbar v-model="snackbar" timeout="2000">
          Copied timings to clipboard!
        </v-snackbar>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Easing from "easing";

export default {
  name: "SplitArcs",
  data: () => ({
    snackbar: null,
    loading: null,
    segments: 4,
    ease_type_x: "",
    ease_type_y: "",
    input:
      "arc(0,10000,0.90,0.10,siso,0.00,0.50,0,none,false);\n" +
      "arc(5000,12345,0.00,0.80,sisi,1.00,0.50,1,none,false);\n" +
      "arc(7500,12228,0.10,0.35,sosi,0.50,1.00,0,none,false);",
    arcs_separated: null,
    use_additional: null,
    ignore_traces: null,
    output_ignored_traces: null,
    height_lines: null,
    additional_type_list: [
      "S",
      "B",
      "Si",
      "So",
      "quadratic-in",
      "cubic-in",
      "quartic-in",
      "quintic-in",
      "sinusoidal-in",
      "exponential-in",
      "circular-in",
      "quadratic-out",
      "cubic-out",
      "quartic-out",
      "quintic-out",
      "sinusoidal-out",
      "exponential-out",
      "circular-out"
    ],
    number_rules: [
      v => !!v || "Value is required",
      v => v >= 1 || "Value must be greater than 0"
    ],
    resulting_list: ""
  }),
  methods: {
    split_arcs() {
      this.loading = true;
      this.resulting_list = "";
      let arcs = this.input.split("\n");
      for (let i = 0; i < arcs.length; i++) {
        if (arcs[i].length > 30) {
          arcs[i] = arcs[i].substring(4, arcs[i].length - 2);
          arcs[i] = arcs[i].split(","); // arcs = [[start,end,x1,x2,ease,y1,y2,colour,none,trace],[...],...];
          while (isNaN(parseInt(arcs[i][0].charAt(0)))) {
            arcs[i][0] = arcs[i][0].substring(1);
          }
        } else {
          arcs.splice(i, 1);
          i -= 1;
        }
      }
      for (let i = 0; i < arcs.length; i++) {
        console.log(`Splitting arc #${i} (${arcs[i]})`);
        if (this.ignore_traces && arcs[i][9] === "true") {
          if (this.output_ignored_traces) {
            console.log("Outputting trace");
            this.resulting_list += `arc(${arcs[i]});\n`;
          } else {
            console.log("Ignoring trace");
          }
        } else {
          let arc = arcs[i];
          let time_step = (arc[1] - arc[0]) / this.segments;
          if (!this.use_additional) {
            let ease_length = arc[4].length;
            switch (ease_length) {
              case 1: // S or B
                this.ease_type_x = arc[4];
                this.ease_type_y = arc[4];
                break;
              case 2: // Si or So
                this.ease_type_x = arc[4];
                this.ease_type_y = "s";
                break;
              case 4: // SiSi, SoSo, SiSo, SoSi
                this.ease_type_x = arc[4].substr(0, 2);
                this.ease_type_y = arc[4].substr(2, 2);
            }
          }
          let fractions_x = this.get_fractions(this.ease_type_x);
          let fractions_y = this.get_fractions(this.ease_type_y);

          let x_coords = this.get_coords(fractions_x, arc[2], arc[3], "x");
          let y_coords = this.get_coords(fractions_y, arc[5], arc[6], "y");
          for (let j = 0; j < this.segments; j++) {
            let start = Math.round(Number(arc[0]) + time_step * j);
            let end = Math.round(Number(arc[0]) + time_step * (j + 1));
            if (this.ignore_traces && arcs[i][9] === "true") {
              console.log("Passing ignored trace.");
            } else if ((j + 1) % 2 === 0 && this.arcs_separated) {
              // eslint-disable-next-line prettier/prettier
              this.resulting_list +=
                `arc(${start},${end},${x_coords[j]},${x_coords[j + 1]},s,${y_coords[j]},${y_coords[j + 1]},${arc[7]},none,true);\n`;
            } else if (j === this.segments - 1) {
              // eslint-disable-next-line prettier/prettier
              this.resulting_list +=
                `arc(${start},${Number(arc[1])},${x_coords[j]},${x_coords[j + 1]},s,${y_coords[j]},${y_coords[j + 1]},${arc[7]},none,${arc[9]});\n`;
            } else {
              // eslint-disable-next-line prettier/prettier
              this.resulting_list +=
                `arc(${start},${end},${x_coords[j]},${x_coords[j + 1]},s,${y_coords[j]},${y_coords[j + 1]},${arc[7]},none,${arc[9]});\n`;
            }
          }
        }
      }
      this.loading = false;
    },
    get_fractions(ease) {
      let fractions = [];
      ease = ease.toLowerCase();
      if (ease === "s" || ease === "b" || ease === "si" || ease === "so") {
        for (let i = 0; i <= this.segments; i++) {
          fractions.push(i / this.segments);
        }
      } else {
        let ease_split = ease.split("-");
        let segments = Number(this.segments) + 1;
        fractions = Easing(segments, ease_split[0]);
        if (ease_split[1] === "in") {
          fractions.reverse();
          for (let i = 0; i < fractions.length; i++) {
            fractions[i] = 1 - fractions[i];
          }
        }
      }
      return fractions;
    },
    get_coords(fractions, start, end, axis) {
      let coords = [];
      let ease = axis === "x" ? this.ease_type_x : this.ease_type_y;
      switch (ease) {
        case "s":
          for (let i = 0; i <= this.segments; i++) {
            let fraction = fractions[i];
            let calc_coord =
              (1 - fraction) * Number(start) + Number(end) * fraction;
            coords.push(calc_coord.toFixed(2));
          }
          break;

        case "b":
          for (let i = 0; i <= this.segments; i++) {
            let fraction = fractions[i];
            let calc_coord =
              (1 - fraction) ** 2 * Number(start) * (1 + 2 * fraction) +
              Number(end) * fraction ** 2 * (3 - 2 * fraction);
            coords.push(calc_coord.toFixed(2));
          }
          break;

        case "si":
          for (let i = 0; i <= this.segments; i++) {
            let fraction = fractions[i];
            let calc_coord =
              Number(start) +
              (Number(end) - Number(start)) *
                Math.sin((fraction * Math.PI) / 2);
            coords.push(calc_coord.toFixed(2));
          }
          break;

        case "so":
          for (let i = 0; i <= this.segments; i++) {
            let fraction = fractions[i];
            let calc_coord =
              Number(start) +
              (Number(end) - Number(start)) *
                (1 - Math.cos((fraction * Math.PI) / 2));
            coords.push(calc_coord.toFixed(2));
          }
          break;
        default:
          for (let i = 0; i <= this.segments; i++) {
            let fraction = fractions[i];
            let calc_coord =
              Number(start) + (Number(end) - Number(start)) * fraction;
            coords.push(calc_coord.toFixed(2));
          }
          break;
      }

      if (axis === "y" && this.height_lines) {
        for (let i = 1; i < coords.length; i++) {
          if (coords[i] === coords[i - 1] && coords[i] === "0.00") {
            coords[i] = "0.01";
          } else if (coords[i] === coords[i - 1]) {
            coords[i] = parseFloat(coords[i]) - 0.01;
            coords[i] = coords[i].toFixed(2);
          }
        }
      }
      return coords;
    },
    copy_list() {
      this.snackbar = true;
      navigator.clipboard.writeText(this.resulting_list);
    }
  }
};
</script>
