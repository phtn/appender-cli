import chalk from "chalk";
import { existsSync, mkdirSync, statSync, writeFileSync } from "fs";
import { dirname } from "path";
import type { LineItem, State } from "./types";

export function checkAndCreateFile(absolute_path: string) {
  try {
    // Create parent directories if they don't exist
    const parent_dir = dirname(absolute_path);
    if (!existsSync(parent_dir)) {
      mkdirSync(parent_dir, { recursive: true });
    }

    writeFileSync(absolute_path, "");
    return true;
  } catch (error) {
    console.log("Failed to create file:", error);
    return false;
  }
}

export function validatePath(path: string) {
  if (!existsSync(path)) {
    return { valid: false, error: "File does not exist" };
  }

  const stats = statSync(path);
  if (stats.isDirectory()) {
    return {
      valid: false,
      error: "",
    };
  }

  return { valid: true };
}

export function insertWithin(content: string, new_lines: string[]) {
  const lastBraceIndex = content.lastIndexOf(",");

  if (lastBraceIndex === -1) {
    return content + "\n" + new_lines.join("\n");
  }

  const lines = new_lines.map((line) => {
    const [label, raw_content] = line.split("::");
    const content = raw_content.substring(
      raw_content.indexOf("><p") + 1,
      raw_content.indexOf("</svg>"),
    );
    return {
      label,
      content,
    };
  });

  const createInsert = (items: LineItem[]): string => {
    const formattedItems = items
      .map(
        (item) =>
          `\n\t${item.label}: {\n\t\tcontent: createContent(\`${item.content}\`),\n\t}`,
      )
      .join(",");

    return `${content.slice(0, lastBraceIndex)},${formattedItems}${content.slice(lastBraceIndex)}`;
  };

  return createInsert(lines);
}

export const handleCreateFile = (
  shouldCreate: boolean,
  path: string,
  state: State,
) => {
  if (shouldCreate) {
    try {
      const parent_dir = dirname(path);
      if (!existsSync(parent_dir)) {
        mkdirSync(parent_dir, { recursive: true });
      }

      writeFileSync(path, "");
      console.log(chalk.green("⤷ File created successfully!"));
      state.is_valid = true;
      state.path = path;
    } catch (e) {
      console.log(chalk.red("Failed to create file: ", e));
    }
  } else {
    console.log(`→ ${chalk.hex("#94a3b8").bold("try a another file")} `);
  }
};

/*
const createInsert = (items: LineItem[]) =>
    content.slice(0, lastBraceIndex) +
    "," +
    items.map((item) => {
      const line =
        "\n\t" +
        item.label +
        ": {\n\t\tcontent: " +
        "`" +
        item.content +
        "`" +
        "\n\t}";
      return line;
    }) +
    content.slice(lastBraceIndex);
*/
