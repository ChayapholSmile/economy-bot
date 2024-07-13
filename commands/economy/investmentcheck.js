const User = require('../../models/User');

module.exports = {
  name: 'investmentcheck',
  description: 'ตรวจสอบการลงทุนและผลตอบแทน',
  callback: async (client, interaction) => {
    try {
      await interaction.deferReply();

      const users = await User.find({});
      for (const user of users) {
        const investmentDuration = (new Date() - user.investmentDate) / (1000 * 60 * 60 * 24); // จำนวนวัน
        if (investmentDuration >= 30) { // สมมุติการลงทุนมีระยะเวลา 30 วัน
          const returns = user.investment * 1.1; // ผลตอบแทน 10%
          user.balance += returns;
          user.investment = 0;
          user.investmentDate = null;
          await user.save();
        }
      }

      await interaction.editReply('ตรวจสอบการลงทุนและผลตอบแทนเรียบร้อยแล้ว!');
    } catch (error) {
      console.error(error);
      await interaction.editReply('เกิดข้อผิดพลาดขณะตรวจสอบการลงทุน โปรดลองอีกครั้ง');
    }
  },
};
