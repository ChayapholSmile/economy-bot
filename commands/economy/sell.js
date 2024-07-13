// commands/sell.js
const { CommandInteraction, ApplicationCommandOptionType } = require('discord.js');
const Product = require('../../models/Product');
const User = require('../../models/User');

module.exports = {
  name: 'sell',
  description: 'ขายสินค้ากลับให้กับร้านค้า',

  options: [
    {
      name: 'product',
      description: 'ชื่อสินค้าที่ต้องการขาย',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'quantity',
      description: 'จำนวนที่ต้องการขาย',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    const productName = interaction.options.getString('product');
    const quantity = interaction.options.getInteger('quantity');

    const product = await Product.findOne({ guildId: interaction.guild.id, name: productName });
    if (!product) {
      await interaction.reply('สินค้าไม่มีในร้านค้า');
      return;
    }

    const user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
    if (!user) {
      await interaction.reply('ไม่พบข้อมูลผู้ใช้');
      return;
    }

    product.stock += quantity;
    user.balance += product.price * quantity;

    await product.save();
    await user.save();

    await interaction.reply(`คุณได้ขาย ${productName} จำนวน ${quantity} ชิ้นเรียบร้อยแล้ว`);
  },
};
