import chalk from "chalk";
import { appendFileSync, readFileSync, watch, writeFileSync } from "fs";
import ora from "ora";
import { insertWithin } from "./file-utils";

export const watchFile = (src: string, des: string, last_content: string) => {
  try {
    last_content = readFileSync(src, "utf8");
  } catch (e) {
    console.error(e);
    return;
  }

  const breadcrumbs = src.split("/");
  console.log(
    `→ watching${chalk.hex("#fdba74")(".../" + breadcrumbs[breadcrumbs.length - 1])}`,
  );
  watch(src, { persistent: true }, async (event_type) => {
    const watch_indicator = ora(" ");
    watch_indicator.spinner = "dots12";
    watch_indicator.start();

    if (event_type === "change") {
      try {
        const current_content = readFileSync(src, "utf8");

        if (current_content === last_content) {
          return;
        }

        const new_lines = findNewLines(last_content, current_content);

        if (new_lines.length > 0) {
          const des_content = readFileSync(des, "utf8");

          const timestamp = new Date().toISOString();
          // const changelog = `\n\n--- changes detected at ${timestamp} ---\n\n${new_lines.join("\n")}`;
          const changelog = [...new_lines];

          const updated_content = insertWithin(des_content, changelog);

          writeFileSync(des, updated_content);
          console.log(
            `${chalk.blue("⤷")} inserted ${new_lines.length} new line(s) into ${des}`,
          );
        }

        last_content = current_content;
      } catch (e) {
        console.error(e);
      }
    }
  });
};

const findNewLines = (old_content: string, new_content: string) => {
  const old_lines = old_content.split("\n");
  const new_lines = new_content.split("\n");
  return new_lines.filter((line) => !old_lines.includes(line));
};
