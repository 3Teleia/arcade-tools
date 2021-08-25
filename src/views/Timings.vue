<template>
  <v-container>
    <v-row>
      <v-col cols="5">
        <v-form>
          <v-row>
            <v-col cols="4">
              <v-text-field
                label="Start time (ms)"
                v-model="start_time"
                required
                type="number"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="End time (ms)"
                v-model="end_time"
                required
                type="number"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="2">
              <v-text-field
                label="Steps"
                v-model="steps"
                required
                type="number"
                min="0"
                :rules="number_rules"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="3">
              <v-text-field
                label="Beat divisor"
                v-model="beat_div"
                required
                type="number"
                step="0.01"
                min="0"
                :rules="number_rules"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="4">
              <v-text-field
                label="Start BPM"
                v-model="start_bpm"
                required
                type="number"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="End BPM"
                v-model="end_bpm"
                required
                type="number"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-overflow-btn
            v-if="!use_additional"
            dense
            menu-props="top"
            label="Select curve type"
            :items="curve_type_list"
            v-model="curve_type"
          ></v-overflow-btn>

          <v-overflow-btn
            v-if="use_additional"
            dense
            menu-props="top"
            label="Select curve type"
            :items="additional_type_list"
            v-model="curve_type"
          ></v-overflow-btn>

          <v-checkbox
            v-model="use_additional"
            label="Use additional easings?"
          ></v-checkbox>
          <v-checkbox
            v-if="use_additional"
            v-model="additional_endToEnd"
            label="End to end (makes the end BPM act as the highest BPM value)"
          ></v-checkbox>
          <v-checkbox
            v-if="use_additional"
            v-model="additional_invert"
            label="Invert"
          ></v-checkbox>

          <v-btn
            :loading="loading"
            block
            depressed
            tile
            color="blue"
            @click="create_timing_list"
          >
            Create timing list
          </v-btn>
        </v-form>

        <v-sparkline
          v-if="bpm_list"
          :value="bpm_list"
          color="black"
          padding="8"
          fill
        >
        </v-sparkline>
      </v-col>
      <v-col cols="7">
        <v-textarea v-if="resulting_list" v-model="resulting_list" label="Output"></v-textarea>

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
const Easing = require("easing");

export default {
  name: "Timings",

  data: () => ({
    snackbar: null,
    loading: null,
    start_time: 0,
    end_time: 1000,
    steps: 4,
    beat_div: 4,
    start_bpm: 100,
    end_bpm: 200,
    curve_type: "", // selected curve type
    curve_type_list: ["S", "B", "Si", "So"],
    use_additional: null,
    additional_type_list: [
      "linear",
      "quadratic",
      "cubic",
      "quartic",
      "quintic",
      "sinusoidal",
      "exponential",
      "circular"
    ],
    additional_endToEnd: null,
    additional_invert: null,
    number_rules: [
      v => !!v || "Value is required",
      v => v >= 0 || "Value must be non-negative"
    ],
    timings_list: [], // {time:, bpm:}
    resulting_list: "",
    bpm_list: [] // used for sparkline
  }),
  methods: {
    create_timing_list: function() {
      if (!this.curve_type) this.curve_type = this.curve_type_list[0]; // sets curve to s if not set
      this.resulting_list = "";
      this.timings_list = [];
      this.bpm_list = [];
      this.loading = true;
      let time_step = (this.end_time - this.start_time) / this.steps;

      // creates all the timing line objects and sets their times
      for (let i = 0; i <= this.steps; i++) {
        this.timings_list[i] = {
          time: Math.round(Number(this.start_time) + Number(time_step) * i)
        };
      }
      // fail-safe
      if (
        this.timings_list[this.timings_list.length - 1].time !== this.end_time
      )
        this.timings_list[this.timings_list.length - 1].time = this.end_time;

      let fractions_list = [];

      if (this.use_additional) {
        let steps = Number(this.steps) + 1;
        fractions_list = Easing(steps, this.curve_type, {
          invert: this.additional_invert,
          endToEnd: this.additional_endToEnd
        });
      } else {
        for (let i = 0; i <= this.steps; i++) {
          fractions_list.push(i / this.steps);
        }
      }

      switch (this.curve_type) {
        case "S":
          for (let i = 0; i <= this.steps; i++) {
            let fraction = fractions_list[i];
            let calc_bpm =
              (1 - fraction) * Number(this.start_bpm) +
              Number(this.end_bpm) * fraction;
            this.timings_list[i].bpm = Math.floor(calc_bpm * 100) / 100;
            this.bpm_list.push(calc_bpm);
          }
          break;

        case "B":
          for (let i = 0; i <= this.steps; i++) {
            let fraction = fractions_list[i];
            let calc_bpm =
              (1 - fraction) ** 2 *
                Number(this.start_bpm) *
                (1 + 2 * fraction) +
              Number(this.end_bpm) * fraction ** 2 * (3 - 2 * fraction);
            this.timings_list[i].bpm = Math.floor(calc_bpm * 100) / 100;
            this.bpm_list.push(calc_bpm);
          }
          break;

        case "Si":
          for (let i = 0; i <= this.steps; i++) {
            let fraction = fractions_list[i];
            let calc_bpm =
              Number(this.start_bpm) +
              (Number(this.end_bpm) - Number(this.start_bpm)) *
                Math.sin((fraction * Math.PI) / 2);
            this.timings_list[i].bpm = Math.floor(calc_bpm * 100) / 100;
            this.bpm_list.push(calc_bpm);
          }
          break;

        case "So":
          for (let i = 0; i <= this.steps; i++) {
            let fraction = fractions_list[i];
            let calc_bpm =
              Number(this.start_bpm) +
              (Number(this.end_bpm) - Number(this.start_bpm)) *
                (1 - Math.cos((fraction * Math.PI) / 2));
            this.timings_list[i].bpm = Math.floor(calc_bpm * 100) / 100;
            this.bpm_list.push(calc_bpm);
          }
          break;
        default:
          for (let i = 0; i <= this.steps; i++) {
            let fraction = fractions_list[i];
            let calc_bpm =
              Number(this.start_bpm) +
              (Number(this.end_bpm) - Number(this.start_bpm)) * fraction;
            this.timings_list[i].bpm = Math.floor(calc_bpm * 100) / 100;
            this.bpm_list.push(calc_bpm);
          }
          break;
      }

      // i hate rounding with a passion
      if (
        this.timings_list[this.timings_list.length - 1].bpm !== this.end_bpm &&
        !this.additional_invert &&
        !this.additional_endToEnd
      )
        this.timings_list[this.timings_list.length - 1].bpm = this.end_bpm;

      for (let i = 0; i < this.timings_list.length; i++) {
        let beat_div = Number(this.beat_div);
        this.resulting_list +=
          i === this.timings_list.length - 1
            ? "timing(" +
              this.timings_list[i].time +
              "," +
              this.timings_list[i].bpm +
              "," +
              beat_div.toFixed(2) +
              ");"
            : "timing(" +
              this.timings_list[i].time +
              "," +
              this.timings_list[i].bpm +
              "," +
              beat_div.toFixed(2) +
              ");\n";
      }

      this.loading = false;
    },
    copy_list() {
      this.snackbar = true;
      navigator.clipboard.writeText(this.resulting_list);
    }
  }
};
</script>

<style scoped></style>
