require("colors");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, MessageFlags } = require("discord.js");
const mConfig = require("./../../messageConfig.json");

module.exports = async (interaction, pages, time = 30_000) => {
	try {
		if (!interaction || !pages || !pages.length > 0) return console.log("[ERROR]".red + "Error trying to use buttonPagination.js: Invalid arguments given");

		await interaction.deferReply();

		if (pages.length === 1) {
			return await interaction.editReply({ embeds: pages, components: [], fetchReply: true, flags: MessageFlags.Ephemeral });
		};

		const prev = new ButtonBuilder()
			.setCustomId('prev')
			.setEmoji('⬅️')
			.setStyle(ButtonStyle.Primary)
			.setDisabled(true);

		const next = new ButtonBuilder()
			.setCustomId('next')
			.setEmoji('➡️')
			.setStyle(ButtonStyle.Primary);

		const buttons = new ActionRowBuilder().setComponents(prev, next);
		let index = 0;

		const msg = await interaction.editReply({ embeds: [pages[index]], components: [buttons], fetchReply: true });

		const btnCollector = await msg.createMessageComponentCollector({ componentType: ComponentType.Button, time });

		btnCollector.on("collect", async (i) => {
			if (i.user.id !== interaction.user.id) {
				const rEmbed = new EmbedBuilder()
					.setColor(`${mConfig.embedColorError}`)
					.setDescription(`${mConfig.cannotUseSelect}`);
				return i.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
			};

			await i.deferUpdate();

			switch (i.customId) {
				case "prev":
					if (index > 0) index--;
					break;
				case "next":
					if (index < pages.length - 1) index++;
					break;
			};

			if (index === 0) {
				prev.setDisabled(true);
			} else {
				prev.setDisabled(false);
			};

			index === pages.length - 1
				? next.setDisabled(true)
				: next.setDisabled(false);


			await msg.edit({ embeds: [pages[index]], components: [buttons] });

			btnCollector.resetTimer();

			btnCollector.on("end", async () => {
				await msg.edit({ embeds: [pages[index]], components: [] });
			});

			return msg;
		});
	} catch (err) {
		console.log("[ERROR]".red + "Error in your buttonPagination.js file:");
		console.log(err);
	};
};
