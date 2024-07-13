const { Client, CommandInteraction, ApplicationCommandOptionType } = require('discord.js');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Loan = require('../../models/Loan');

module.exports = {
  name: 'bankbalance',
  description: 'ตรวจสอบยอดเงินในบัญชีธนาคาร',

  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      interaction.reply({
        content: 'คุณสามารถใช้คำสั่งนี้ได้เฉพาะในเซิร์ฟเวอร์เท่านั้น',
        ephemeral: true,
      });
      return;
    }

    try {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      const user = await User.findOne({ userId, guildId });

      if (!user) {
        interaction.reply({
          content: 'ไม่พบบัญชีผู้ใช้',
          ephemeral: true,
        });
        return;
      }

      const loans = await Loan.find({ userId: mongoose.Types.ObjectId(user._id) });

      const totalBalance = user.balance;
      const totalLoans = loans.reduce((sum, loan) => sum + loan.amount, 0);

      interaction.reply({
        content: `ยอดเงินในบัญชีธนาคารของคุณคือ ${totalBalance} บาท\nยอดเงินกู้ทั้งหมด: ${totalLoans} บาท`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error running command:', error);
      interaction.reply({
        content: 'เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง',
        ephemeral: true,
      });
    }
  },
};
