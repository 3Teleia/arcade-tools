<template>
  <v-container>
    <v-row>
      <v-col cols="5">
        <v-form>
          <v-row>
            <v-textarea label="Input" v-model="input"></v-textarea>
          </v-row>
          <v-btn
            :loading="loading"
            block
            depressed
            tile
            color="blue"
            @click="convert_input(input, false)"
          >
            Convert
          </v-btn>
        </v-form>
      </v-col>
      <v-col cols="7">
        <v-textarea
          v-if="output"
          v-model="output"
          label="Output"
          rows="10"
        ></v-textarea>
        <v-btn
          block
          depressed
          tile
          color="blue"
          @click="copy_list"
          v-if="output"
        >
          Copy to clipboard
        </v-btn>
        <v-snackbar v-model="snackbar" timeout="2000">
          Copied to clipboard!
        </v-snackbar>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "AffToArc",
  data: () => ({
    input: "",
    loading: null,
    snackbar: null,
    output: ""
  }),
  methods: {
    copy_list() {
      this.snackbar = true;
      navigator.clipboard.writeText(this.output);
    },
    convert_input(raw_input) {
      this.output = "";
      this.loading = true;
      const outside = this;
      class arc_objects {
        timing(input) {
          outside.timing(input);
        }
        tap(input) {
          outside.tap(input);
        }
        hold(input) {
          outside.hold(input);
        }
        arc(input) {
          outside.arc(input);
        }
        trace(input) {
          outside.trace(input);
        }
        arctap(input) {
          outside.arctap(input);
        }
      }
      let arc_objects_conv = new arc_objects();
      let input = raw_input.split("\n");
      // Remove empty line that tends to be at the end of .aff files so the loading doesn't appear broken
      if (input.at(-1) === "") {
        input.splice(-1, 1);
      }

      this.output += "settings\n";
      this.output += `audio_offset ${input[0].split(":")[1]}\n`;
      this.output += "chart\n";

      for (let i = 2; i < input.length; i++) {
        let line = input[i].split("(");
        let type = line[0].trim();
        if (type === "timinggroup") {
          this.output += "new_group ";
          if (line[1].slice(0, -2) === "noinput") {
            this.output += "noinput";
          }
          this.output += "\n";
        } else if (type === "};") {
          console.log("timinggroup end skipped");
        } else {
          let data = line[1].slice(0, -2).split(",");
          if (type === "arc") {
            // checks if arc is a trace
            if (data.at(-1).startsWith("true")) {
              this.trace(data);
              // checks if there is also arctap data
              if (line.length !== 2) {
                let arctaps = input[i].split("[")[1].slice(0, -2).split(",");
                for (let n = 0; n < arctaps.length; n++) {
                  let timing = arctaps[n].split("(")[1].slice(0, -1);
                  this.arctap(timing);
                }
              }
            } else {
              this.arc(data);
            }
          } else if (type) {
            arc_objects_conv[type](data);
          } else {
            this.tap(data);
          }
        }
      }
      this.loading = false;
    },
    timing(input) {
      // timing(t,bpm,measure); => timing (t) (bpm) (measure)
      this.output += `timing ${input[0]} ${input[1]} ${input[2]}\n`;
    },
    tap(input) {
      // (t,lane); => tap (t) (lane)
      this.output += `tap ${input[0]} ${input[1]}\n`;
    },
    hold(input) {
      // hold(t0,t1,lane); => hold (t0) (t1) (lane)
      this.output += `hold ${input[0]} ${input[1]} ${input[2]}\n`;
    },
    arc(input) {
      // arc(t0,t1,x0,x1,ease,y0,y1,colour,none,false); => arc (t0) (t1) (x0) (y0) (x1) (y1) (ease) (colour)
      this.output += `arc ${input[0]} ${input[1]} ${input[2]} ${input[5]} ${input[3]} ${input[6]} ${input[4]} ${input[7]}\n`;
    },
    trace(input) {
      // arc(t0,t1,x0,x1,ease,y0,y1,colour,none,true); => trace (t0) (t1) (x0) (y0) (x1) (y1) (ease)
      this.output += `trace ${input[0]} ${input[1]} ${input[2]} ${input[5]} ${input[3]} ${input[6]} ${input[4]}\n`;
    },
    arctap(input) {
      // following traces, [arctap(...)] => arctap (t)
      this.output += `arctap ${input}\n`;
    }
  }
};
</script>

<style scoped></style>
