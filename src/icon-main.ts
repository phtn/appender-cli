import chalk from "chalk";
import { watchFile } from "./file-watcher";
import { getValidFilePath } from "./prompt-handler";
import type { FilePath } from "./types";

export const icon = async () => {
  const last_content = "";
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
    console.log(`→ ${paths.src.name} file: ${chalk.hex("#fdba74")(src)}`);
    const des = await getValidFilePath(paths.des);
    console.log(`→ ${paths.des.name} file: ${chalk.hex("#bef264")(des)}`);

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
