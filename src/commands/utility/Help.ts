import { CommandBuilder, Command, CommandContext, Utils } from "@lib";
import { MessageActionRow, MessageSelectMenu, SelectMenuInteraction } from "discord.js";
import { client } from "../../index";

@CommandBuilder({ name: "help", description: "get help lol test" }, { group: "utility" })
export default class Help extends Command {
    async exec(interaction: CommandContext) {
        const catArray = [...client.commands.values()];
        const Row = new MessageActionRow().addComponents(
            new MessageSelectMenu().setCustomId("select").addOptions([
                {
                    label: "Hello",
                    description: "fgfdsg",
                    value: "test",
                },
            ])
        );

        await interaction.reply(Utils.embed("Testing select menu!"), {
            ephemeral: true,
            components: [Row],
        });

        const collector = interaction.channel.createMessageComponentCollector({
            filter: (i: any) => i.user.id === interaction.user.id,
            dispose: true,
            time: 10000,
        });

        collector.on("collect", async (i: SelectMenuInteraction) => {
            return await i.reply({
                embeds: [Utils.embed(`You said: \`${i.values[0]}\``)],
                ephemeral: true,
            });
        });

        collector.on("end", () => {
            Row.components.forEach((e) => e.setDisabled(true));

            interaction.interaction.editReply({
                embeds: [Utils.embed("It ended!")],
                components: [Row],
            });
        });
    }
}
