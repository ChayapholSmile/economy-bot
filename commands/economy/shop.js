// commands/shop.js
const { CommandInteraction, Client } = require('discord.js');
const Product = require('../../models/Product');

module.exports = {
  name: 'shop',
  description: 'แสดงรายการสินค้าในร้านค้า',

  callback: async (client, interaction) => {
    const products = await Product.find({ guildId: interaction.guild.id });
    if (products.length === 0) {
      await interaction.reply('ไม่มีสินค้าที่พร้อมขายในร้านค้าตอนนี้');
      return;
    }

    let shopList = 'รายการสินค้าในร้านค้า:\n';
    products.forEach(product => {
      shopList += `${product.name}: ${product.price} บาท (มี ${product.stock} ชิ้น)\n`;
    });

    await interaction.reply(shopList);
  },
};
