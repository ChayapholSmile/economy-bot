// commands/leaderboard.js
const { CommandInteraction } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  name: 'leaderboard',
  description: 'แสดงอันดับของผู้ใช้ตามยอดเงิน',

  callback: async (client, interaction) => {
    const users = await User.find({ guildId: interaction.guild.id }).sort({ balance: -1 }).limit(10);

    let leaderboard = '🏆 **Leaderboard** 🏆\n\n';
    users.forEach((user, index) => {
      leaderboard += `**${index + 1}.** <@${user.userId}>: ${user.balance} บาท\n`;
    });

    await interaction.reply(leaderboard);
  },
};
