import { CommandBuilder, Command, CommandContext, MessageChannel, Utils } from "@lib";

@CommandBuilder(
    { name: "shuffle", description: "Shuffles all songs in the queue." },
    { group: "music" }
)
export default class Join extends Command {
    async exec(interaction: CommandContext) {
        const vc = interaction.guild?.voiceStates?.cache?.get(interaction.user.id)?.channel;
        if (!vc) {
            return interaction.reply(Utils.embed("Join a vc bozo"), { ephemeral: true });
        }

        /* check if a player already exists for this guild. */
        const player = interaction.client.music.createPlayer(vc.guild.id);
        if (player && player?.channelId !== vc.id) {
            return interaction.reply(Utils.embed(`Join <#${player.channelId}> bozo.`), {
                ephemeral: true,
            });
        }

        if (!player?.playing)
            return interaction.reply(Utils.embed("I need to be playing to do this, bozo."), {
                ephemeral: true,
            });

        if (player?.queue.tracks.length === 0) {
            return await interaction.reply(Utils.embed("I cant shuffle the queue if its empty!"), {
                ephemeral: true,
            });
        }

        player.queue.shuffle();

        return await interaction.reply(
            Utils.embed(`Shuffled all ${player?.queue?.tracks?.length} songs in the queue!`),
            { ephemeral: true }
        );
    }
}
