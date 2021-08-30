import { CommandBuilder, Command, CommandContext, Utils as Util } from "@lib";

@CommandBuilder({ name: "clear", description: "Clears the queues songs." }, { group: "music" })
export default class Clear extends Command {
    async exec(interaction: CommandContext) {
        const vc = interaction.guild?.voiceStates?.cache?.get(interaction.user.id)?.channel;
        if (!vc) {
            return interaction.reply(Util.embed("Join a voice channel bozo"), { ephemeral: true });
        }

        /* check if a player already exists, if so check if the invoker is in our vc. */
        let player = interaction.client.music.players.get(interaction.guild!.id);

        if (player && player.channelId !== vc.id) {
            return interaction.reply(Util.embed(`Join <#${player.channelId}> bozo.`), {
                ephemeral: true,
            });
        }

        if (!player?.playing)
            return interaction.reply(Util.embed("I need to be playing to do this, bozo."), {
                ephemeral: true,
            });
        player.queue.tracks = [];
        return interaction.reply(Util.embed(":boom: ***Cleared the queue!***"), {
            ephemeral: true,
        });
    }
}
