import { CommandBuilder, Command, CommandContext, MessageChannel, Utils } from "@lib";
import { client } from "../../index";

@CommandBuilder(
    {
        name: "pause",
        description: "Pauses or resumes the player, depending on its state.",
    },
    { group: "music" }
)
export default class Join extends Command {
    async exec(interaction: CommandContext) {
        const vc = interaction.guild?.voiceStates?.cache?.get(interaction.user.id)?.channel;
        if (!vc) {
            return interaction.reply(Utils.embed("Join a vc bozo"), { ephemeral: true });
        }

        /* check if a player already exists for this guild. */
        const player = client.music.createPlayer(vc.guild.id);

        if (player && player.channelId !== vc.id) {
            return interaction.reply(Utils.embed(`Join <#${player.channelId}> bozo.`), {
                ephemeral: true,
            });
        }

        if (!player?.playing)
            return interaction.reply(Utils.embed("I need to be playing to do this, bozo."), {
                ephemeral: true,
            });
        if (player.paused) {
            player.resume();
            return await interaction.reply(Utils.embed("▶ ***Resumed!***"), { ephemeral: true });
        }
        if (player.playing) {
            player.pause(true);
            return await interaction.reply(Utils.embed("⏸ ***Paused!***"), { ephemeral: true });
        }
    }
}
