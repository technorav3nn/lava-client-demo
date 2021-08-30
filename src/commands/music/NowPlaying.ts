import { CommandBuilder, Command, CommandContext, MessageChannel, Utils } from "@lib";
import {
    MessageActionRow,
    MessageButton,
    MessageSelectMenu,
    MessageEmbed,
    Snowflake,
    ButtonInteraction,
    SelectMenuInteraction,
    Interaction,
} from "discord.js";
import { Player } from "lavaclient";
import { client } from "../../index";
import { BUTTON_COLORS } from "../../lib/types/ButtonColors";
import ms from "pretty-ms";

@CommandBuilder(
    { name: "nowplaying", description: "Shows the now playing song in this guild." },
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

        if (player && player.channelId !== vc.id) {
            return interaction.reply(Utils.embed(`Join <#${player.channelId}> bozo.`), {
                ephemeral: true,
            });
        }

        if (!player?.playing)
            return interaction.reply(Utils.embed("I need to be playing to do this, bozo."), {
                ephemeral: true,
            });
        let currentSong = player?.queue?.current;

        const Row = new MessageActionRow().addComponents(
            new MessageButton()
                .setStyle(BUTTON_COLORS.BLUE)
                .setLabel("Skip")
                .setCustomId("np_skip"),
            new MessageButton()
                .setStyle(BUTTON_COLORS.BLUE)
                .setLabel("Pause")
                .setCustomId("np_pause"),
            new MessageButton()
                .setStyle(
                    player.paused
                        ? BUTTON_COLORS.RED
                        : player.playing
                        ? BUTTON_COLORS.BLUE
                        : BUTTON_COLORS.GREY
                )
                .setLabel("Leave")
                .setCustomId("np_leave")
        );
        const volSelect = new MessageSelectMenu()
            .setCustomId("vol_select")
            .setPlaceholder("Set Volume Level");

        const muteEmoji: string = "🔇";
        const soundEmoji: string = "🔈";
        const mediumSoundEmoji: string = "🔉";
        const highSoundEmoji: string = "🔊";

        for (let i = 0; i <= 10; i++) {
            const volumeToAdd = i * 10;
            let chosenEmoji: string =
                volumeToAdd === 0
                    ? muteEmoji
                    : volumeToAdd <= 30
                    ? soundEmoji
                    : volumeToAdd <= 70
                    ? mediumSoundEmoji
                    : volumeToAdd <= 80 || volumeToAdd > 80
                    ? highSoundEmoji
                    : mediumSoundEmoji;
            let content: string = `Increase the volume by ${volumeToAdd}% percent`;
            if (i === 0) content = `Mute the bot`;

            volSelect.addOptions({
                label: `${volumeToAdd}%`,
                description: content,
                value: `${volumeToAdd}`,
                emoji: chosenEmoji,
            });
        }
        const volRow = new MessageActionRow().addComponents(volSelect);

        player.setMaxListeners(30);
        player.on("trackException", async (e) => {
            await interaction.reply({
                content: `I had an error! Reported to devs! Debug: ${e}`,
            });

            console.error(`Major Error reported in ${e}!`);
            return;
        });

        const SongEmbed = new MessageEmbed()
            .setColor("BLUE")
            .setTitle(
                `Song currently playing for guild \"${interaction?.guild?.name ?? "Unknown"}\"`
            )
            .setDescription(
                `
            [${currentSong?.title ?? "Unknown"}](${currentSong!.uri}) by \`${
                    currentSong?.author ?? "Unknown"
                }\`

            ${createBar(player)} \`[${ms(Number(player.position), {
                    colonNotation: true,
                    secondsDecimalDigits: 0,
                })}/${ms(Number(currentSong!.length), { colonNotation: true })}]\`
            `
            )
            .addFields({
                name: `Requester`,
                value: `\`${
                    client.users.cache.get(player.queue.current!.requester as Snowflake)!.tag ??
                    "Unknown"
                }\``,
                inline: true,
            });
        await interaction.reply({
            content: "\u200b",
            embeds: [SongEmbed],
            components: [Row, volRow],
        });

        player?.on("trackStuck", () => {
            player.resume();
            console.log("Stuck!");
        });

        const filter = (i: Interaction) =>
            i.user.id === interaction.user.id && i.channel!?.type !== "DM";
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 20000,
            dispose: true,
        });

        collector.on("collect", async (i: ButtonInteraction) => {
            try {
                const member = await interaction.guild?.members.fetch(interaction.user);

                if (!member?.voice.channel?.id)
                    return await i
                        .reply({
                            content: "you must be in a voice channel to use these buttons, bud.",
                            ephemeral: true,
                        })
                        .catch();

                if (i.customId === "np_skip") {
                    player.pause(true);
                    player.resume();

                    await player.queue.next().catch(async () => {
                        await i.reply({ content: "Queue is empty!", ephemeral: true });
                        collector.stop("queue");
                        return;
                    });

                    await i.reply({ content: "Skipped!", ephemeral: true }).catch();
                }
                if (i.customId === "np_pause") {
                    if (player.paused) {
                        player.resume();

                        Row.components.forEach((button: any) => {
                            if (button.customId === "np_pause") {
                                button.setStyle("SUCCESS");
                                button.setLabel("Pause");
                            }
                        });

                        await i.update({
                            content: "\u200b",
                            embeds: [SongEmbed],
                            components: [Row, volRow],
                        });

                        await i.reply({ content: "Resumed!" });
                    } else if (player.playing) {
                        player.pause(true);

                        Row.components.forEach((button: any) => {
                            if (button.customId === "np_pause") {
                                (button as MessageButton).setStyle("DANGER");
                                button.setLabel("Play");
                            }
                        });
                        await interaction.interaction.editReply({
                            content: "\u200b",
                            embeds: [SongEmbed],
                            components: [Row, volRow],
                        });
                        await i.reply({ content: "Paused!" });
                    }
                }
                if (i.customId === "vol_select") {
                    const selectedVolume = parseInt(
                        (i as unknown as SelectMenuInteraction).values[0]
                    );

                    player.setVolume(selectedVolume);
                    let content: string =
                        selectedVolume === 0
                            ? `Succesfully muted the current song!`
                            : `Succesfully set the volume level to ${selectedVolume}%!`;
                    i.reply({ content });
                }
            } catch {}
        });
        collector.on("end", async (_, reason: string) => {
            Row.components.forEach((button: any) => button.setDisabled(true).setStyle("SECONDARY"));

            volRow.components[0].setDisabled(true);
            if (player.paused) player.pause();
            if (player.playing) player.resume();

            player.pause(true);
            player.resume();

            if (reason === "queue") {
                await interaction.interaction.editReply({
                    content: "Queue is empty!",
                    embeds: [SongEmbed],
                    components: [Row, volRow],
                });
                return;
            }
            await interaction.interaction.editReply({
                content: "\u200b",
                embeds: [SongEmbed],
                components: [Row, volRow],
            });
        });
        function createBar(player: Player) {
            let size = 25;
            let line = "▬";
            let slider = "🔘";

            if (!player.queue.current) return `${slider}${line.repeat(size - 1)}]`;
            let current =
                player.queue.current.length !== 0 ? player.position : player.queue.current.length;
            let total = player.queue.current.length;
            let bar =
                current! > total
                    ? [line.repeat((size / 2) * 2), (current! / total) * 100]
                    : [
                          line
                              .repeat(Math.round((size / 2) * (current! / total)))
                              .replace(/.$/, slider) +
                              line.repeat(size - Math.round(size * (current! / total)) + 1),
                          current! / total,
                      ];

            if (!String(bar).includes(slider)) return `${slider}${line.repeat(size - 1)}`;
            return `${bar[0]}`;
        }
    }
}
