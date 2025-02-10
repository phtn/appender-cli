#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { existsSync, statSync, mkdirSync, writeFileSync, readFileSync, watch } from 'fs';
import ora from 'ora';
import { dirname, resolve } from 'path';
import { input, confirm } from '@inquirer/prompts';

function checkAndCreateFile(absolute_path) {
    try {
        // Create parent directories if they don't exist
        const parent_dir = dirname(absolute_path);
        if (!existsSync(parent_dir)) {
            mkdirSync(parent_dir, {
                recursive: true
            });
        }
        writeFileSync(absolute_path, "");
        return true;
    } catch (error) {
        console.log("Failed to create file:", error);
        return false;
    }
}
function validatePath(path) {
    if (!existsSync(path)) {
        return {
            valid: false,
            error: "File does not exist"
        };
    }
    const stats = statSync(path);
    if (stats.isDirectory()) {
        return {
            valid: false,
            error: ""
        };
    }
    return {
        valid: true
    };
}
function insertWithin(content, new_lines) {
    const lastBraceIndex = content.lastIndexOf(",");
    if (lastBraceIndex === -1) {
        return content + "\n" + new_lines.join("\n");
    }
    const lines = new_lines.map((line)=>{
        const [label, raw_content] = line.split("::");
        const content = raw_content.substring(raw_content.indexOf("><p") + 1, raw_content.indexOf("</svg>"));
        return {
            label,
            content
        };
    });
    const createInsert = (items)=>{
        const formattedItems = items.map((item)=>`\n\t${item.label}: {\n\t\tcontent: createContent(\`${item.content}\`),\n\t}`).join(",");
        return `${content.slice(0, lastBraceIndex)},${formattedItems}${content.slice(lastBraceIndex)}`;
    };
    return createInsert(lines);
}

const watchFile = (src, des, last_content)=>{
    try {
        last_content = readFileSync(src, "utf8");
    } catch (e) {
        console.error(e);
        return;
    }
    const breadcrumbs = src.split("/");
    console.log(`→ watching${chalk.hex("#fdba74")(".../" + breadcrumbs[breadcrumbs.length - 1])}`);
    watch(src, {
        persistent: true
    }, async (event_type)=>{
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
                    const changelog = [
                        ...new_lines
                    ];
                    const updated_content = insertWithin(des_content, changelog);
                    writeFileSync(des, updated_content);
                    console.log(`${chalk.blue("⤷")} inserted ${new_lines.length} new line(s) into ${des}`);
                }
                last_content = current_content;
            } catch (e) {
                console.error(e);
            }
        }
    });
};
const findNewLines = (old_content, new_content)=>{
    const old_lines = old_content.split("\n");
    const new_lines = new_content.split("\n");
    return new_lines.filter((line)=>!old_lines.includes(line));
};

async function getValidFilePath(state) {
    while(!state.is_valid){
        const prompt = {
            input: {
                src: {
                    message: "source file: ",
                    required: true
                },
                des: {
                    message: "destination file: ",
                    required: true
                }
            }
        };
        const is_source = state.name === "source";
        state.path = await input(is_source ? prompt.input.src : prompt.input.des);
        const absolute_path = resolve(state.path.trim());
        const validation = validatePath(absolute_path);
        const confirm_prompt = {
            src: {
                message: `${chalk.hex("#fca5a5").bold("✕")} ${chalk.hex("#fdba74")(state.path)} file doesn't exist. ${chalk.cyan.bold("create source file?")}`,
                default: true
            },
            des: {
                message: `${chalk.hex("#fca5a5").bold("✕")} ${chalk.hex("#bef264")(state.path)} file doesn't exist. ${chalk.cyan.bold("create destination file?")}`,
                default: true
            }
        };
        if (!validation.valid) {
            if (validation.error === "file doesn't exist") {
                const shouldCreate = await confirm(is_source ? confirm_prompt.src : confirm_prompt.des);
                if (shouldCreate && checkAndCreateFile(absolute_path)) {
                    console.log(`⤷ ${is_source ? "source" : "destination"} file created.`);
                    state.is_valid = true;
                    state.path = absolute_path;
                    continue;
                } else {
                    console.log("try a different path.");
                    continue;
                }
            } else {
                console.log(`${chalk.hex("#fca5a5").bold("✕")} ${chalk.hex(is_source ? "#fdba74" : "#bef264").bold(state.path)} points to a directory. provide a file path.`);
                continue;
            }
        }
        state.is_valid = true;
        state.path = absolute_path;
    }
    return state.path;
}

const icon = async ()=>{
    const last_content = "";
    const paths = {
        src: {
            name: "source",
            is_valid: false,
            path: ""
        },
        des: {
            name: "destination",
            is_valid: false,
            path: ""
        }
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
        process.on("SIGINT", ()=>{
            console.log("\n watcher shutting down...");
            process.exit(0);
        });
    } catch (e) {
        console.error(e);
    }
};

const program = new Command();
program.name("appender-cli").description("append texts at the bottom of the file.").version("0.1.2");
program.command("version").alias("v").option("-V, --version", "-v").description("get cli version number").action(()=>console.log("appender-cli v0.1.1"));
program.command("icon").description("append svgs to list").action(icon);
program.parse(); //const spinner = ora("yo let's go: ");
