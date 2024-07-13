// commands/economy/borrow.js
const { Client, Interaction, ApplicationCommandOptionType } = require('discord.js');
const User = require('../../models/User');
const Loan = require('../../models/Loan');
module.exports = {
  name: 'borrow',
  description: 'กู้เงินจากธนาคารหรือจากผู้ใช้อื่น',
  options: [
    {
      name: 'amount',
      description: 'จำนวนเงินที่ต้องการกู้',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
    {
      name: 'lender',
      description: 'ผู้ให้กู้ (ระบุ "bank" หรือผู้ใช้)',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'interest',
      description: 'ดอกเบี้ยที่ต้องชำระ',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
    {
      name: 'due_date',
      description: 'กำหนดเวลาคืนเงิน (รูปแบบ YYYY-MM-DD)',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  callback: async (client, interaction) => {
    const borrowerId = interaction.user.id;
    const amount = interaction.options.getInteger('amount');
    const lender = interaction.options.getString('lender');
    const interest = interaction.options.getInteger('interest');
    const dueDate = new Date(interaction.options.getString('due_date'));

    if (amount <= 0 || interest < 0) {
      interaction.reply({ content: 'จำนวนเงินหรือดอกเบี้ยไม่ถูกต้อง', ephemeral: true });
      return;
    }

    const borrower = await User.findOne({ userId: borrowerId, guildId: interaction.guild.id });

    if (!borrower) {
      interaction.reply({ content: 'ไม่พบผู้ใช้ที่ต้องการกู้เงิน', ephemeral: true });
      return;
    }

    let lenderUserId;
    if (lender.toLowerCase() === 'bank') {
      lenderUserId = 'bank';
    } else {
      const lenderUser = await User.findOne({ userId: lender, guildId: interaction.guild.id });
      if (!lenderUser) {
        interaction.reply({ content: 'ไม่พบผู้ให้กู้ที่ระบุ', ephemeral: true });
        return;
      }
      lenderUserId = lenderUser.userId;
    }

    // Create a new loan entry
    const newLoan = new Loan({
      borrowerId,
      lenderId: lenderUserId,
      amount,
      interest,
      dueDate,
    });

    await newLoan.save();

    // Update borrower's balance
    borrower.balance += amount;
    await borrower.save();

    interaction.reply({ content: `คุณได้กู้เงินจำนวน ${amount} บาท จาก ${lender === 'bank' ? 'ธนาคาร' : `<@${lender}>`} สำเร็จแล้ว`, ephemeral: true });
  },
};
