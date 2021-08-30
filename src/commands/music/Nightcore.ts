import { CommandBuilder, Command, CommandContext, Utils } from "@lib";

@CommandBuilder(
    { name: "nightcore", description: "Enabled the nightcore filter in this guild." },
    { group: "music" }
)
export default class Nightcore extends Command {
    async exec(ctx: CommandContext) {
        /* check if there is a player for this guild. */
        const player = ctx.player;
        if (!player?.connected) {
            return ctx.reply(Utils.embed("There's no active player for this guild."), {
                ephemeral: true,
            });
        }

        /* toggle the nightcore filter. */
        player.filters.timescale = (player.nightcore = !player.nightcore)
            ? { speed: 1.1, pitch: 1.1, rate: 1 }
            : undefined;

        await player.setFilters();
        return ctx.reply(
            Utils.embed(`${player.nightcore ? "Enabled" : "Disabled"} the **nightcore** filter!`)
        );
    }
}
