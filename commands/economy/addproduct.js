// commands/addproduct.js
const { CommandInteraction, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const Product = require('../../models/Product');

module.exports = {
  name: 'addproduct',
  description: 'เพิ่มสินค้าลงในร้านค้า (เฉพาะเจ้าของเซิร์ฟเวอร์)',

  options: [
    {
      name: 'name',
      description: 'ชื่อสินค้า',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'price',
      description: 'ราคาสินค้า',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
    {
      name: 'stock',
      description: 'จำนวนสต็อก',
      type: ApplicationCommandOptionType.Integer,
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
    const price = interaction.options.getInteger('price');
    const stock = interaction.options.getInteger('stock');

    const product = new Product({
      guildId: interaction.guild.id,
      name,
      price,
      stock,
    });

    await product.save();
    await interaction.reply(`เพิ่มสินค้า ${name} ลงในร้านค้าเรียบร้อยแล้ว`);
  },
};
