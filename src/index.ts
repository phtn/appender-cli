#!/usr/bin/env node

import { Command } from "commander";
import { icon } from "./icon-main";
import pkg from "../package.json";

const program = new Command();
program
  .name("iconxsvg")
  .description("append svg symbols to the bottom of the file.")
  .version(`v${pkg.version}`);
program
  .command("version")
  .alias("v")
  .option("-V, --version", "-v")
  .description("get cli version number")
  .action(() => console.log(`iconxsvg v${pkg.version}`));
program.command("icon").description("append svgs to list").action(icon);
program.parse();
