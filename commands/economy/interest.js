const User = require('../../models/User');
const { Client, Interaction, ApplicationCommandOptionType, AttachmentBuilder, InteractionCollector } = require('discord.js');


module.exports = {
  name: 'interest',
  description: 'คำนวณดอกเบี้ยให้กับผู้ใช้ทุกคน',
  callback: async (client) => {
    const users = await User.find({});

    users.forEach(async user => {
      const interest = user.bank * 0.01; // สมมุติดอกเบี้ย 1%
      user.bank += interest;
      await user.save();
    });

    interaction.reply(
        'คำนวณดอกเบี้ยเรียบร้อยแล้ว'
    );
  },
};
