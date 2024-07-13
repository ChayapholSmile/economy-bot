const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  name: 'withdraw',
  description: 'ถอนเงินจากบัญชีธนาคาร',
  options: [
    {
      name: 'amount',
      description: 'จำนวนเงินที่ต้องการถอน',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],
  callback: async (client, interaction) => {
    const amount = interaction.options.getInteger('amount');
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    if (amount <= 0) {
      interaction.reply({ content: 'จำนวนเงินที่ถอนต้องมากกว่า 0', ephemeral: true });
      return;
    }

    const user = await User.findOne({ userId, guildId });

    if (!user || user.bank < amount) {
      interaction.reply({ content: 'ยอดเงินในธนาคารไม่พอ', ephemeral: true });
      return;
    }

    user.bank -= amount;
    user.balance += amount;
    await user.save();

    interaction.reply({ content: `ถอนเงินจำนวน ${amount} บาท จากบัญชีธนาคารเรียบร้อยแล้ว` });
  },
};
