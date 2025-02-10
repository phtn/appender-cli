#!/usr/bin/env node

import { Command } from "commander";
import { icon } from "./icon-main";

const program = new Command();
program
  .name("appender-cli")
  .description("append texts at the bottom of the file.")
  .version("0.1.2");
program
  .command("version")
  .alias("v")
  .option("-V, --version", "-v")
  .description("get cli version number")
  .action(() => console.log("appender-cli v0.1.1"));
program.command("icon").description("append svgs to list").action(icon);
program.parse(); //const spinner = ora("yo let's go: ");
