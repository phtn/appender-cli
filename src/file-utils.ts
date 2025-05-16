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
  const lastBraceIndex = content.trim().lastIndexOf("}");

  const lines = createNewLines(new_lines);

  const createInsert = (items: LineItem[]): string => {
    const formattedItems = items
      .map(
        (item) =>
          `${lastBraceIndex === 1 ? "," : ""}\n\t${item.name}: {\n\t\tsymbol: \`${item.symbol}\`,\n\t\tviewBox: \`${item.viewBox}\`,\n\t\tset: \`${item.set}\`,\n\t}${new_lines.length > 1 ? "" : ","}`,
      )
      .join(",");

    return `${content.slice(0, lastBraceIndex)}${formattedItems}${content.slice(lastBraceIndex)}`;
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

export const transformSvgAttributes = (svg: string): string => {
  let transformed = svg;
  transformed = transformed.replace(/stroke-linecap/g, "strokeLinecap");
  transformed = transformed.replace(/stroke-linejoin/g, "strokeLinejoin");
  transformed = transformed.replace(/stroke-width/g, "strokeWidth");
  return transformed;
};

const createNewLines = (lines: string[]) =>
  lines.map((line) => {
    if (line.trim().startsWith("<symbol")) {
      const viewBoxMatch = line.match(/viewBox="([^"]*)"/);
      const idMatch = line.match(/id="([^"]*)"/);

      if (viewBoxMatch && idMatch) {
        const viewBox = viewBoxMatch[1];
        const id = idMatch[1];
        const parts = id.split("-");
        const set = parts[0];
        const name =
          parts.length > 1
            ? parts.length > 2
              ? `"${parts.slice(1).join("-")}"`
              : parts[1]
            : undefined;

        const symbolContentMatch = line.match(/<symbol.*?>(.*?)<\/symbol>/);
        let symbol = "";
        if (symbolContentMatch) {
          symbol = symbolContentMatch[1].trim();
        }

        symbol = symbol.substring(symbol.indexOf("->") + 2);
        symbol = symbol.replaceAll("#888888", "currentColor");
        symbol = symbol.replaceAll('="1.5"', '="1"');

        return { set, symbol, name, viewBox };
      }
    }
  }) as LineItem[];
