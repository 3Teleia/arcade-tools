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
            @click="convert_file(input, false)"
          >
            Convert
          </v-btn>
        </v-form>
      </v-col>
      <v-col cols="7">
        <v-textarea v-if="output" v-model="output" label="Output" rows="10"></v-textarea>
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
  name: "ArcToAff",
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
    convert_file(raw_input, timing_group) {
      // I wrote all of this 4 months ago and have no idea why it works
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
      let counter = 0;
      let input = raw_input.split("\n");
      if (!timing_group) {
        this.output = "";
        counter = 3;
        this.output += `AudioOffset:${input[1].split(" ")[1]}\n`;
        this.output += "-\n";
      }
      for (let i = counter; i < input.length; i++) {
        let line = input[i].split(" ");
        if (timing_group && line[0].length) this.output += "  ";
        if (line[0] === "trace") {
          this.trace(line);
          let next = input[i + 1].split(" ");
          if (next[0] === "arctap") {
            let arctaps = [];
            while (next[0] === "arctap") {
              arctaps.push(this.arctap(next));
              i++;
              next = input[i + 1].split(" ");
            }
            this.output += `[${arctaps}]`;
          }
          this.output += ";\n";
        } else if (line[0] === "new_group") {
          if (timing_group) this.output += "};\n";
          this.output += "timinggroup(";
          if (line[1] === "noinput") this.output += "noinput";
          this.output += "){\n";
          i++;
          let tg_input = "";
          line = input[i];
          while (line !== "new_group " && i < input.length) {
            tg_input += `${line}\n`;
            i++;
            line = input[i];
          }
          i--;
          this.convert_file(tg_input, true);
          if (!timing_group) this.output += "};\n";
        } else if (line[0].length) {
          arc_objects_conv[line[0]](line);
        } else {
          input.splice(i, 1);
          i -= 1;
        }
      }
    },
    timing(input) {
      // timing (t) (bpm) (measure) => timing(...);
      input.shift();
      this.output += `timing(${input});\n`;
    },
    tap(input) {
      // tap (t) (lane) => (...);
      input.shift();
      this.output += `(${input});\n`;
    },
    hold(input) {
      // hold (t0) (t1) (lane) => hold(...);
      input.shift();
      this.output += `hold(${input});\n`;
    },
    arc(input) {
      // arc (t0) (t1) (x0) (y0) (x1) (y1) (ease) (colour) => arc([t0,t1,x0,x1,ease,y0,y1,colour],none,false);
      input.shift();
      this.output += `arc(${input[0]},${input[1]},${input[2]},${input[4]},${input[6]},${input[3]},${input[5]},${input[7]},none,false);\n`;
    },
    trace(input) {
      // trace (t0) (t1) (x0) (y0) (x1) (y1) (ease) => arc(...)
      input.shift();
      this.output += `arc(${input[0]},${input[1]},${input[2]},${input[4]},${input[6]},${input[3]},${input[5]},0,none,true)`;
    },
    arctap(input) {
      // following traces, arctap (t) => [arctap(...)]
      input.shift();
      return `arctap(${input[0]})`;
    }
  }
};
</script>

<style scoped></style>
