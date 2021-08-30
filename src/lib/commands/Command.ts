import type { ApplicationCommand, ApplicationCommandData } from "discord.js";
import type { CommandContext } from "./CommandContext";
import type { Class } from "type-fest";

import { client } from "../../index";

export function CommandBuilder(
    data: ApplicationCommandData,
    other: { group: string; test?: boolean }
) {
    return (target: Class<Command>) => {
        return class extends target {
            constructor(...args: any[]) {
                super(data, other, ...args);

                client.catagories.set(other?.group!, other);
            }
        };
    };
}

export class Command {
    readonly data: ApplicationCommandData;
    readonly other!: { group: string; test?: true };

    ref!: ApplicationCommand;

    constructor(data: ApplicationCommandData) {
        this.data = data;
    }

    exec(ctx: CommandContext, options?: Record<string, any>): any {
        void [ctx, options];
    }
}
