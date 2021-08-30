import { CommandBuilder, Command, CommandContext, MessageChannel, Utils } from "@lib";

@CommandBuilder(
    { name: "join", description: "Joins the member's voice channel." },
    { group: "music" }
)
export default class Join extends Command {
    async exec(interaction: CommandContext) {
        /* check if the invoker is in a voice channel. */
        const vc = interaction.guild?.voiceStates?.cache?.get(interaction.user.id)?.channel;
        if (!vc) {
            return interaction.reply(Utils.embed("Join a vc bozo"), { ephemeral: true });
        }

        /* check if a player already exists for this guild. */
        const player = interaction.client.music.createPlayer(vc.guild.id);
        if (player.connected) {
            return interaction.reply(Utils.embed("I'm already connected to a vc."), {
                ephemeral: true,
            });
        }

        /* set the queue channel. */
        player.queue.channel = interaction.channel as MessageChannel;

        /* connect to the vc. */
        await player.connect(vc.id);

        return interaction.reply(Utils.embed(`Joined ${vc}`));
    }
}
