import "@lavaclient/queue/register";
import type { MessageChannel } from "./Utils";

export * from "./Bot";
export * from "./Utils";

export * from "./commands/Command";
export * from "./commands/CommandContext";

declare module "lavaclient" {
    interface Player {
        nightcore: boolean;
    }
}

declare module "@lavaclient/queue" {
    interface Queue {
        channel: MessageChannel;
    }
}
