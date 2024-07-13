const { Client, CommandInteraction, ApplicationCommandOptionType } = require('discord.js');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Loan = require('../../models/Loan');

module.exports = {
  name: 'repay',
  description: 'ชำระเงินกู้',

  options: [
    {
      name: 'amount',
      description: 'จำนวนเงินที่ต้องการชำระ',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: 'คุณสามารถใช้คำสั่งนี้ได้เฉพาะในเซิร์ฟเวอร์เท่านั้น',
        ephemeral: true,
      });
      return;
    }

    const amount = interaction.options.getInteger('amount');
    if (amount <= 0) {
      await interaction.reply({
        content: 'จำนวนเงินต้องมากกว่า 0',
        ephemeral: true,
      });
      return;
    }

    try {
      const userId = interaction.user.id;
      const guildId = interaction.guild.id;

      const user = await User.findOne({ userId, guildId });
      if (!user) {
        await interaction.reply({
          content: 'ไม่พบบัญชีผู้ใช้',
          ephemeral: true,
        });
        return;
      }

      const loans = await Loan.find({ userId: user._id });
      if (loans.length === 0) {
        await interaction.reply({
          content: 'คุณไม่มีเงินกู้ที่ต้องชำระ',
          ephemeral: true,
        });
        return;
      }

      let totalRepayable = loans.reduce((sum, loan) => sum + loan.amount, 0);
      if (amount > totalRepayable) {
        await interaction.reply({
          content: `จำนวนเงินที่ต้องชำระมากกว่ายอดเงินกู้ทั้งหมด (${totalRepayable} บาท)`,
          ephemeral: true,
        });
        return;
      }

      let remainingAmount = amount;
      for (const loan of loans) {
        if (remainingAmount <= 0) break;

        if (loan.amount <= remainingAmount) {
          remainingAmount -= loan.amount;
          await loan.remove();
        } else {
          loan.amount -= remainingAmount;
          remainingAmount = 0;
          await loan.save();
        }
      }

      user.balance -= amount;
      await user.save();

      await interaction.reply({
        content: `คุณได้ชำระเงินกู้จำนวน ${amount} บาทเรียบร้อยแล้ว`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error running repay command:', error);
      await interaction.reply({
        content: 'เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง',
        ephemeral: true,
      });
    }
  },
};
