import { Song } from "@lavaclient/queue";
import { CommandBuilder, Command, CommandContext, MessageChannel, Utils } from "@lib";

@CommandBuilder(
    {
        name: "move",
        description: "Moves a song to a specific position in the queue.",
        options: [
            {
                name: "from",
                description: "The place from the queue to move it",
                type: "INTEGER",
                required: true,
            },
            {
                name: "to",
                description: "The place where it will finally be placed.",
                type: "INTEGER",
                required: true,
            },
        ],
    },
    { group: "music" }
)
export default class Join extends Command {
    async exec(interaction: CommandContext, { from, to }: { from: number; to: number }) {
        /* check if the invoker is in a voice channel. */
        const vc = interaction.guild?.voiceStates?.cache?.get(interaction.user.id)?.channel;
        if (!vc) {
            return interaction.reply(Utils.embed("Join a vc bozo"), { ephemeral: true });
        }

        /* check if a player already exists for this guild. */
        const player = interaction.client.music.createPlayer(vc.guild.id);

        if (player && player.channelId !== vc.id) {
            return interaction.reply(Utils.embed(`Join <#${player.channelId}> bozo.`), {
                ephemeral: true,
            });
        }

        if (!player?.playing)
            return interaction.reply(Utils.embed("I need to be playing to do this, bozo."), {
                ephemeral: true,
            });

        if (
            from === to ||
            isNaN(from) ||
            from < 1 ||
            from > player.queue.tracks.length ||
            isNaN(to) ||
            to < 1 ||
            to > player.queue.tracks.length
        )
            return interaction.reply(
                Utils.embed("Number is invalid or exceeds queue length, try again buddy."),
                { ephemeral: true }
            );
        if (player.queue.tracks[from] === player.queue.current)
            return interaction.reply(Utils.embed("you cant move older songs stupid lol!!"), {
                ephemeral: true,
            });
        const oldSong = player.queue.tracks[from - 1];
        arrayMove(player.queue.tracks, from - 1, to - 1);

        return await interaction.reply(
            Utils.embed(`ok buddy, i moved \`${oldSong.title}\` to position ${to}`),
            { ephemeral: true }
        );
    }
}

function arrayMove(arr: Song[], old_index: number, new_index: number) {
    arr.splice(old_index, 0, arr.splice(new_index, 1)[0]);
    return arr;
}
