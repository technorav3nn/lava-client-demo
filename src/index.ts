import "dotenv/config";
import "module-alias/register";
import { Utils, Bot, CommandContext } from "@lib";
import { ButtonInteraction, Interaction, MessageActionRow, MessageButton } from "discord.js";
import { BUTTON_COLORS } from "./lib/types/ButtonColors";

export const client = new Bot();

client.music.on("connect", () => {
    console.log(`[music] now connected to lavalink`);
});

client.music.on("queueFinish", (queue) => {
    const embed = Utils.embed("Uh oh, the queue has ended.");

    queue.channel.send({ embeds: [embed] });
    queue.player.disconnect();
    queue.player.node.destroyPlayer(queue.player.guildId);
});

client.music.on("trackStart", async (queue, song) => {
    const embed = Utils.embed(`Requested by ${song.requester ? ` <@${song.requester}>` : ""}`);

    embed.setAuthor(
        `${song.title.substring(0, 50)}`,
        "https://cdn.discordapp.com/emojis/859459305152708630.gif"
    );
    const Row = new MessageActionRow().addComponents(
        new MessageButton()
            .setStyle(BUTTON_COLORS.GREY)
            .setCustomId("start_skip")
            .setLabel("Skip")
            .setEmoji("<:474498:882388633963884594>"),
        new MessageButton()
            .setStyle(BUTTON_COLORS.GREY)
            .setCustomId("start_pause")
            .setLabel("Pause")
            .setEmoji("<:pausing:882391652063408198>"),
        new MessageButton()
            .setStyle(BUTTON_COLORS.GREY)
            .setCustomId("start_stop")
            .setLabel("Stop")
            .setEmoji("<:stopbutton:882393658018627594>")
    );
    const msg = await queue.channel.send({ embeds: [embed], components: [Row] });
    const collector = queue.channel.createMessageComponentCollector({
        filter: (i: Interaction) => i.user.id === queue.current?.requester,
        time: queue.current?.length,
        dispose: true,
    });

    collector.on("collect", async (i: ButtonInteraction) => {
        try {
            const { player } = queue;
            if (i.customId === "start_skip") {
                const notQueueEmpty: boolean = await queue.next();

                if (!notQueueEmpty) {
                    await i.reply({
                        embeds: [Utils.embed("Looks like the queue is empty")],
                        ephemeral: true,
                    });
                    return collector.stop();
                } else {
                    await i.reply({ embeds: [Utils.embed("Skipped!")], ephemeral: true });
                }
            }
            if (i.customId === "start_pause") {
                if (player.paused) {
                    player.resume();

                    Row.components.forEach((button: any) => {
                        if (button.customId === "start_pause") {
                            button.setLabel("Pause");
                        }
                    });

                    await i.update({
                        embeds: [embed],
                        components: [Row],
                    });

                    await i.followUp({ content: "Resumed!", ephemeral: true });
                } else if (player.playing) {
                    player.pause(true);

                    Row.components.forEach((button: any) => {
                        if (button.customId === "start_pause") {
                            button.setLabel("Play");
                        }
                    });
                    await i.update({
                        embeds: [embed],
                        components: [Row],
                    });
                    await i.followUp({ content: "Paused!", ephemeral: true });
                }
            }
            if (i.customId === "start_stop") {
                client.music.destroyPlayer(i.guild?.id!);
                player.disconnect();

                await i.reply({ embeds: [Utils.embed("Stopped and disconnected!")] });

                collector.stop();
            }
        } catch (err) {
            console.log(err);
        }
    });

    collector.on("end", async (_, _reason: string) => {
        Row.components.forEach((btn) => btn.setDisabled(true));

        await msg.edit({ embeds: [embed], components: [Row] });
    });

    queue.player.on("trackEnd", () => {
        collector.stop();
    });
});

client.on("ready", async () => {
    console.log("[discord] ready!");
    client.music.connect(client.user!.id); // Client#user shouldn't be null on ready
    await Utils.syncCommands(client, __dirname + "/commands", true, true);
});

client.on("interactionCreate", (interaction) => {
    if (interaction.isCommand()) {
        const options = Object.assign(
            {},
            ...interaction.options.data.map((i) => ({ [i.name]: i.value }))
        );
        client.commands.get(interaction.commandId)?.exec(new CommandContext(interaction), options);
    }
});

client.on("messageCreate", async (message) => {
    if (message.content === "*deploy") {
        await Utils.syncCommands(client, __dirname + "/commands", false, true);
    }
});

client.login("ODgwMTc1NzQ2MzU2NzQwMTc3.YSadig.xfqiVqCjuoOZgos8daUfV7t1fr4");
