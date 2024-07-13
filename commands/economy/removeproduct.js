// commands/removeproduct.js
const { CommandInteraction, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const Product = require('../../models/Product');

module.exports = {
  name: 'removeproduct',
  description: 'ลบสินค้าจากร้านค้า (เฉพาะเจ้าของเซิร์ฟเวอร์)',

  options: [
    {
      name: 'name',
      description: 'ชื่อสินค้าที่ต้องการลบ',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    if (interaction.guild.ownerId !== interaction.user.id) {
      await interaction.reply({
        content: 'คำสั่งนี้ใช้ได้เฉพาะเจ้าของเซิร์ฟเวอร์เท่านั้น',
        ephemeral: true,
      });
      return;
    }

    const name = interaction.options.getString('name');
    const product = await Product.findOneAndDelete({ guildId: interaction.guild.id, name });

    if (!product) {
      await interaction.reply('ไม่พบสินค้าที่ต้องการลบ');
      return;
    }

    await interaction.reply(`ลบสินค้า ${name} ออกจากร้านค้าเรียบร้อยแล้ว`);
  },
};
