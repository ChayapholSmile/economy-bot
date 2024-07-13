const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/User');

module.exports = {
  name: 'invest',
  description: 'ลงทุนเงินเพื่อรับผลตอบแทนในระยะยาว',
  options: [
    {
      name: 'amount',
      description: 'จำนวนเงินที่ต้องการลงทุน',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],
  callback: async (client, interaction) => {
    const amount = interaction.options.getInteger('amount');
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    if (amount <= 0) {
      interaction.reply({ content: 'จำนวนเงินที่ลงทุนต้องมากกว่า 0', ephemeral: true });
      return;
    }

    const user = await User.findOne({ userId, guildId });

    if (!user || user.balance < amount) {
      interaction.reply({ content: 'ยอดเงินคงเหลือในบัญชีไม่พอ', ephemeral: true });
      return;
    }

    user.balance -= amount;
    user.investment += amount;
    user.investmentDate = new Date();
    await user.save();

    interaction.reply({ content: `ลงทุนเงินจำนวน ${amount} บาท เรียบร้อยแล้ว` });
  },
};
