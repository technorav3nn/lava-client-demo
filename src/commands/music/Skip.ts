import { CommandBuilder, Command, CommandContext, Utils } from "@lib";

@CommandBuilder(
    { name: "skip", description: "Skips the current song!" },
    {
        group: "music",
    }
)
export default class Ping extends Command {
    async exec(interaction: CommandContext) {
        const music = interaction.client.music;

        const vc = interaction.guild?.voiceStates?.cache?.get(interaction.user.id)?.channel;
        if (!vc) {
            return interaction.reply({ content: "Join a voice channel bozo", ephemeral: true });
        }

        let player = music.players.get(interaction.guild!.id);

        if (!player?.connected || !player || !player.playing) {
            return interaction.reply(Utils.embed("No player exists in this guild."), {
                ephemeral: true,
            });
        }

        try {
            const good = await player.queue.next();
            return await interaction.reply(
                Utils.embed(`${good ? "Skipped!" : "Looks like the queue has ended. :/"}`),
                { ephemeral: true }
            );
        } catch {}
    }
}
