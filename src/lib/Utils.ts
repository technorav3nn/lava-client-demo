import { MessageEmbed, MessageEmbedOptions } from "discord.js";
import { lstatSync, readdirSync } from "fs";
import { join } from "path";

import type { Command } from "@lib";
import type { Bot } from "./Bot";
import type { NewsChannel, TextChannel, ThreadChannel } from "discord.js";

export type MessageChannel = TextChannel | ThreadChannel | NewsChannel;

export abstract class Utils {
    static PRIMARY_COLOR = 0xfff269;
<<<<<<< HEAD
    static OTHER_COLOR = 0x0093ff;

    static embed(embed: MessageEmbedOptions | string): MessageEmbed {
        const options: MessageEmbedOptions =
            typeof embed === "string" ? { description: embed } : embed;
        options.color ??= Utils.OTHER_COLOR;
=======

    static embed(embed: MessageEmbedOptions | string): MessageEmbed {
        const options: MessageEmbedOptions = typeof embed === "string" ? { description: embed } : embed;
        options.color ??= Utils.PRIMARY_COLOR;
>>>>>>> a4753d341d37918b525ae98f3789f205da5ab022

        return new MessageEmbed(options);
    }

    static walk(directory: string): string[] {
        function read(dir: string, files: string[] = []) {
            for (const item of readdirSync(dir)) {
<<<<<<< HEAD
                const path = join(dir, item),
                    stat = lstatSync(path);
                if (stat.isDirectory()) {
                    files.concat(read(path, files));
=======
                const path = join(dir, item), stat = lstatSync(path)
                if (stat.isDirectory()) {
                    files.concat(read(path, files))
>>>>>>> a4753d341d37918b525ae98f3789f205da5ab022
                } else if (stat.isFile()) {
                    files.push(path);
                }
            }

            return files;
        }

        return read(directory);
    }

<<<<<<< HEAD
    static async syncCommands(
        client: Bot,
        dir: string,
        soft: boolean = false,
        testing: boolean = false
    ) {
=======
    static async syncCommands(client: Bot, dir: string, soft: boolean = false) {
>>>>>>> a4753d341d37918b525ae98f3789f205da5ab022
        const commands: Command[] = [];
        for (const path of Utils.walk(dir)) {
            const { default: Command } = await import(path);
            if (!Command) {
                continue;
            }

            commands.push(new Command());
        }

<<<<<<< HEAD
        const commandManager = client.application!.commands;
        const existing = await commandManager.fetch();
=======
        const commandManager = client.application!.commands,
            existing = await commandManager.fetch();
>>>>>>> a4753d341d37918b525ae98f3789f205da5ab022

        /* do soft sync */
        if (soft) {
            for (const command of commands) {
<<<<<<< HEAD
                const ref = existing.find((c) => c.name === command.data.name);
                if (!ref) {
                    continue;
=======
                const ref = existing.find(c => c.name === command.data.name)
                if (!ref) {
                    continue
>>>>>>> a4753d341d37918b525ae98f3789f205da5ab022
                }

                command.ref = ref;
                client.commands.set(ref.id, command);
            }

<<<<<<< HEAD
            console.log(
                `[discord] slash commands: registered ${client.commands.size}/${commands.length} commands.`
            );
=======
            console.log(`[discord] slash commands: registered ${client.commands.size}/${commands.length} commands.`);
>>>>>>> a4753d341d37918b525ae98f3789f205da5ab022
            return;
        }

        /* get the slash commands to add, update, or remove. */
<<<<<<< HEAD
        const adding = commands.filter((c) => existing.every((e) => e.name !== c.data.name));
        const updating = commands.filter((c) => existing.some((e) => e.name === c.data.name));
        const removing = [
            ...existing.filter((e) => commands.every((c) => c.data.name !== e.name)).values(),
        ];

        console.log(
            `[discord] slash commands: removing ${removing.length}, adding ${adding.length}, updating ${updating.length}`
        );

        /* update/create slash commands. */

        const creating = [...adding, ...updating];
        if (testing) {
            const created = await commandManager.set(creating.map((c) => c.data));
            for (const command of creating) {
                command.ref = created.find((c) => c.name === command.data.name)!;
                client.commands.set(command.ref.id, command);
            }
        }

        if (!testing) {
            const created = client.guilds.cache
                .get("820366973951148043")
                ?.commands.set(creating.map((c) => c.data));
            for (const command of creating) {
                command.ref = (await created)?.find((c) => c.name === command.data.name)!;
                client.commands.set(command.ref.id, command);
            }
=======
        const adding = commands.filter(c => existing.every(e => e.name !== c.data.name))
            , updating = commands.filter(c => existing.some(e => e.name === c.data.name))
            , removing = [ ...existing.filter(e => commands.every(c => c.data.name !== e.name)).values() ];

        console.log(`[discord] slash commands: removing ${removing.length}, adding ${adding.length}, updating ${updating.length}`)

        /* update/create slash commands. */
        const creating = [...adding, ...updating],
            created = await commandManager.set(creating.map(c => c.data));

        for (const command of creating) {
            command.ref = created.find(c => c.name === command.data.name)!;
            client.commands.set(command.ref.id, command);
>>>>>>> a4753d341d37918b525ae98f3789f205da5ab022
        }
    }
}
