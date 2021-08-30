import { CommandBuilder, Command, CommandContext, MessageChannel, Utils } from "@lib";
import { MessageActionRow, MessageButton, ButtonInteraction, Interaction } from "discord.js";
import ms from "pretty-ms";

@CommandBuilder(
    { name: "queue", description: "Shows the queue and its song in this guild." },
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
        if (!player?.queue)
            return interaction.reply(Utils.embed("There is nothing in the queue!"), {
                ephemeral: true,
            });

        // Queue command

        let fromIndex: number;

        const pages: string[] = [];

        let fullQueue = [...player.queue.previous, player.queue.current, ...player.queue.tracks];
        if (player.queue.previous.length === 0)
            fullQueue = [player.queue.current, ...player.queue.tracks];
        const mappedQueue = fullQueue.map((song, index) => {
            fromIndex = index;
            song!.position = index;
            fullQueue[index]!.position = index;

            let j = index;

            return `${++index}) ${song!.title.substring(0, 45)} [${ms(Number(song?.length), {
                colonNotation: true,
            })}] ${
                song!.position === player.queue.current!.position ? `\n ⬑ Current song! ⬏ \n` : ""
            }`;
        });

        const newMap = player.queue.previous.map((song, index) => {
            let j = index;
            return `${++index}) ${song.title.substring(0, 45)}`;
        });
        mappedQueue.unshift(newMap.join(""));

        //pages.push(copy.join("\n"));

        let k = 10;
        for (let i = 0; i < mappedQueue.length; i++) {
            //if (i === 0) continue;
            let j = i;
            const gotContent = mappedQueue.splice(i, k);
            k += 10;
            pages.push(gotContent.join("\n"));
        }

        let loc = 0;

        const Row = new MessageActionRow().addComponents(
            new MessageButton()
                .setStyle("SECONDARY")
                .setLabel("Previous")
                .setCustomId("queue_prev"),

            new MessageButton().setStyle("SECONDARY").setLabel("Next").setCustomId("queue_next")
        );
        await interaction.reply({
            content: `${"```css"}${"\n"}${pages[loc]}${"\n"}${"```"}`,
            components: [Row],
        });
        const filter = (i: Interaction) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000,
            dispose: true,
        });
        console.log(pages);
        collector.on("collect", async (i: ButtonInteraction) => {
            try {
                if (!pages)
                    return await i
                        .reply({ content: `There are no pages!`, ephemeral: true })
                        .catch();

                if (i.customId === "queue_next") {
                    loc++;
                    if (loc === pages.length) loc = 0;
                    if (pages[loc].includes("css")) {
                        return await i
                            .reply({ content: `There are no pages!`, ephemeral: true })
                            .catch();
                    }
                    await i
                        .update({ content: `${"```css"}${"\n"}${pages[loc]}${"\n"}${"```"}` })
                        .catch();
                }
                if (i.customId === "queue_prev") {
                    loc--;
                    if (loc === -1) loc = pages.length - 1;
                    if (pages[loc].includes("css")) {
                        return await i
                            .reply({ content: `There are no pages!`, ephemeral: true })
                            .catch();
                    }
                    await i
                        .update({ content: `${"```css"}${"\n"}${pages[loc]}${"\n"}${"```"}` })
                        .catch();
                }
            } catch (err) {
                console.log("Unknown interaction error");
            }
        });
        collector.on("end", (_collected: any, _result: string) => {
            Row.components.forEach((button: any) => button.setDisabled(true));

            interaction.interaction.editReply({
                content: `${"```css"}${"\n"}${pages[loc]}${"\n"}${"```"}`,
                components: [Row],
            });
        });
    }
}
