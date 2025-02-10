import { confirm, input } from "@inquirer/prompts";
import chalk from "chalk";
import { existsSync, statSync } from "fs";
import { resolve } from "path";
import { handleCreateFile } from "./file-utils";
import { watchFile } from "./file-watcher";

interface State {
  name: string;
  is_valid: boolean;
  path: string;
}
interface FilePath {
  src: State;
  des: State;
}

const getValidFilePath = async (state: State) => {
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

    const confirm_prompt = {
      src: {
        message: `${chalk.hex("#fca5a5").bold("✕")} ${chalk.cyan(state.path)} file doesn't exist. ${chalk.cyan.bold("create source file?")}`,
        default: true,
      },
      des: {
        message: `${chalk.hex("#fca5a5").bold("✕")} ${chalk.cyan(state.path)} file doesn't exist. ${chalk.cyan.bold("create destination file?")}`,
        default: true,
      },
    };

    if (!existsSync(absolute_path)) {
      const shouldCreate = await confirm(
        is_source ? confirm_prompt.src : confirm_prompt.des,
      );
      handleCreateFile(shouldCreate, absolute_path, state);
      continue;
    }
    const stats = statSync(absolute_path);
    if (stats.isDirectory()) {
      console.log(
        `${chalk.hex("#fdba74").bold("→")} ${chalk.cyan.bold(state.path)} is a directory.`,
      );
      continue;
    }
    state.is_valid = true;
    state.path = absolute_path;
  }

  return state.path;
};

let last_content = "";

export const main = async () => {
  const paths: FilePath = {
    src: {
      name: "source",
      is_valid: false,
      path: "",
    },
    des: {
      name: "destination",
      is_valid: false,
      path: "",
    },
  };
  try {
    const src = await getValidFilePath(paths.src);
    console.log(`${paths.src.name} file set: ${chalk.cyan(src)}`);
    const des = await getValidFilePath(paths.des);
    console.log(`${paths.des.name} file set: ${chalk.cyan(des)}`);

    if (src === des) {
      console.error("Source and Destination files must be different.");
      return;
    }

    watchFile(src, des, last_content);

    process.stdin.resume();

    process.on("SIGINT", () => {
      console.log("\n watcher shutting down...");
      process.exit(0);
    });
  } catch (e) {
    console.error(e);
  }
};

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);
