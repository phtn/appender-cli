import { confirm, input } from "@inquirer/prompts";
import { resolve } from "path";
import { checkAndCreateFile, validatePath } from "./file-utils";
import type { State } from "./types.js";
import chalk from "chalk";

export async function getValidFilePath(state: State) {
  while (!state.is_valid) {
    const prompt = {
      input: {
        src: {
          message: "source file: ",
          required: true,
        },
        des: {
          message: "destination file: ",
          required: true,
        },
      },
    };

    const is_source = state.name === "source";
    state.path = await input(is_source ? prompt.input.src : prompt.input.des);
    const absolute_path = resolve(state.path.trim());
    const validation = validatePath(absolute_path);

    const confirm_prompt = {
      src: {
        message: `${chalk.hex("#fca5a5").bold("✕")} ${chalk.hex("#fdba74")(state.path)} file doesn't exist. ${chalk.cyan.bold("create source file?")}`,
        default: true,
      },
      des: {
        message: `${chalk.hex("#fca5a5").bold("✕")} ${chalk.hex("#bef264")(state.path)} file doesn't exist. ${chalk.cyan.bold("create destination file?")}`,
        default: true,
      },
    };

    if (!validation.valid) {
      if (validation.error === "file doesn't exist") {
        const shouldCreate = await confirm(
          is_source ? confirm_prompt.src : confirm_prompt.des,
        );

        if (shouldCreate && checkAndCreateFile(absolute_path)) {
          console.log(
            `⤷ ${is_source ? "source" : "destination"} file created.`,
          );
          state.is_valid = true;
          state.path = absolute_path;
          continue;
        } else {
          console.log("try a different path.");
          continue;
        }
      } else {
        console.log(
          `${chalk.hex("#fca5a5").bold("✕")} ${chalk.hex(is_source ? "#fdba74" : "#bef264").bold(state.path)} points to a directory. provide a file path.`,
        );
        continue;
      }
    }

    state.is_valid = true;
    state.path = absolute_path;
  }

  return state.path;
}
