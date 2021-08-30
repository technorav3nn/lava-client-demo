import { Addable, Song } from "@lavaclient/queue";
import { Track } from "@lavaclient/types";
import { CommandBuilder, Command, CommandContext, MessageChannel, Utils } from "@lib";
import {
    Interaction,
    MessageActionRow,
    MessageEmbed,
    MessageSelectMenu,
    SelectMenuInteraction,
} from "discord.js";
import ms from "pretty-ms";

@CommandBuilder(
    {
        name: "search",
        description: "Searches for a song on youtube, and you can choose which one to play.",
        options: [
            {
                name: "query",
                description: "The query to search youtube with.",
                type: "STRING",
                required: true,
            },
        ],
    },
    { group: "music" }
)
export default class Join extends Command {
    async exec(interaction: CommandContext, { query }: { query: string }) {
        const vc = interaction.guild?.voiceStates?.cache?.get(interaction.user.id)?.channel;
        if (!vc) {
            return interaction.reply(Utils.embed("Join a vc bozo"), { ephemeral: true });
        }

        /* check if a player already exists for this guild. */
        let player = interaction.client.music.createPlayer(vc.guild.id);
        if (player && player?.channelId !== vc.id && player.channelId !== null) {
            return interaction.reply(Utils.embed(`Join <#${player.channelId}> bozo.`), {
                ephemeral: true,
            });
        }

        const results = await interaction.client.music.rest.loadTracks(
            /^https?:\/\//.test(query) ? query : `ytsearch:${query}`
        );

        let tracks: Addable[] = [];

        switch (results.loadType) {
            case "LOAD_FAILED":
            case "NO_MATCHES":
                return interaction.reply(Utils.embed("No matches were found!"), {
                    ephemeral: true,
                });
            case "TRACK_LOADED":
            case "SEARCH_RESULT":
                tracks = results.tracks;
                break;
        }

        const embed = new MessageEmbed().setColor(Utils.OTHER_COLOR);
        let newTracks = tracks.map((track, index) => {
            const song = track as Track;
            console.log(song);
            return `\`${++index}.\` [${truncate(song.info.title, 60)}](${
                song.info.uri
            })\n>>> Duration: \`${ms(song.info.length, {
                colonNotation: true,
                secondsDecimalDigits: 0,
            })}\``;
        });

        const SelectMenu = new MessageSelectMenu().setCustomId("search_menu");

        if (tracks.length >= 10) tracks = tracks.slice(0, 10);
        if (newTracks.length >= 10) newTracks = newTracks.slice(0, 10);

        embed.setDescription(newTracks.join("\n"));

        tracks.forEach((track, index) => {
            const song = track as Track;

            SelectMenu.addOptions([
                {
                    label: `${++index}) ${song?.info?.title.substring(0, 60)}`,
                    description: `By ${truncate(song.info.author, 60)}, Duration: ${ms(
                        song.info?.length,
                        {
                            colonNotation: true,
                            secondsDecimalDigits: 0,
                        }
                    )} `,
                    value: song?.info.uri,
                },
            ]);
        });
        const Row = new MessageActionRow().addComponents(SelectMenu);
        await interaction.reply(embed, { components: [Row] });

        const filter = (i: Interaction) =>
            i.user.id === interaction.user.id &&
            (i as SelectMenuInteraction).customId === "search_menu";
        const collector = interaction.channel.createMessageComponentCollector({
            componentType: "SELECT_MENU",
            filter,
            time: 15000,
            dispose: true,
        });

        collector.on("collect", async (i: SelectMenuInteraction) => {
            const selectedSong = i.values[0];
            const started = player.playing || player.paused;

            player.queue.channel = interaction.channel as MessageChannel;

            const tracks = await player.node.rest.loadTracks(selectedSong);
            const toAdd = tracks.tracks[0];
            if (!player?.connected) {
                player ??= interaction.client.music.createPlayer(interaction.guild!.id);
                player.queue.channel = interaction.channel as MessageChannel;
                player.connect(vc.id, { deafened: true });
            }
            player.queue.add(toAdd.track, i.user.id);

            if (!started) await player.queue.start();

            await i.reply({
                embeds: [Utils.embed(`Added \`${truncate(toAdd.info.title, 60)}\` to the queue!`)],
                ephemeral: true,
            });
            collector.stop();
        });
        collector.on("end", async () => {
            Row.components.forEach((e) => e.setDisabled(true));

            interaction.interaction.editReply({ embeds: [embed], components: [Row] });
        });
    }
}

function truncate(input: string, len: number) {
    if (input.length > len) {
        return input.substring(0, len) + "...";
    }
    return input;
}
