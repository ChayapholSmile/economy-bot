// commands/buy.js
const { CommandInteraction, ApplicationCommandOptionType } = require('discord.js');
const Product = require('../../models/Product');
const User = require('../../models/User');

module.exports = {
  name: 'buy',
  description: 'ซื้อสินค้าจากร้านค้า',

  options: [
    {
      name: 'product',
      description: 'ชื่อสินค้าที่ต้องการซื้อ',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'quantity',
      description: 'จำนวนที่ต้องการซื้อ',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],

  callback: async (client, interaction) => {
    const productName = interaction.options.getString('product');
    const quantity = interaction.options.getInteger('quantity');

    const product = await Product.findOne({ guildId: interaction.guild.id, name: productName });
    if (!product || product.stock < quantity) {
      await interaction.reply('สินค้าไม่มีในสต็อกหรือมีจำนวนไม่เพียงพอ');
      return;
    }

    const user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
    if (!user || user.balance < product.price * quantity) {
      await interaction.reply('ยอดเงินไม่เพียงพอ');
      return;
    }

    product.stock -= quantity;
    user.balance -= product.price * quantity;

    await product.save();
    await user.save();

    await interaction.reply(`คุณได้ซื้อ ${productName} จำนวน ${quantity} ชิ้นเรียบร้อยแล้ว`);
  },
};
