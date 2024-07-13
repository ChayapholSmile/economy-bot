const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  name: 'deposit',
  description: 'ฝากเงินเข้าบัญชีธนาคาร',
  options: [
    {
      name: 'amount',
      description: 'จำนวนเงินที่ต้องการฝาก',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],
  callback: async (client, interaction) => {
    const amount = interaction.options.getInteger('amount');
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    if (amount <= 0) {
      interaction.reply({ content: 'จำนวนเงินที่ฝากต้องมากกว่า 0', ephemeral: true });
      return;
    }

    const user = await User.findOne({ userId, guildId });

    if (!user || user.balance < amount) {
      interaction.reply({ content: 'ยอดเงินคงเหลือในบัญชีไม่พอ', ephemeral: true });
      return;
    }

    user.balance -= amount;
    user.bank += amount;
    await user.save();

    interaction.reply({ content: `ฝากเงินจำนวน ${amount} บาท เข้าบัญชีธนาคารเรียบร้อยแล้ว` });
  },
};
