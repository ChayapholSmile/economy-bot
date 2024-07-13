const { Client, Interaction, ApplicationCommandOptionType, AttachmentBuilder } = require('discord.js');
const { registerFont, createCanvas, loadImage } = require('canvas');
const path = require('path');
const User = require('../../models/User');

// Register custom font
registerFont(path.join(__dirname, 'fonts', 'Itim-Regular.ttf'), { family: 'Itim' });

module.exports = {
  name: 'donate',  // Ensure the command name is lowercase and valid
  description: 'บริจาคเงินให้กับองค์กรการกุศลหรือกิจกรรมต่างๆ ในเซิร์ฟเวอร์',
  options: [
    {
      name: 'amount',
      description: 'จำนวนเงินที่ต้องการบริจาค',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
    {
      name: 'charity',
      description: 'ชื่อองค์กรการกุศลหรือกิจกรรมที่ต้องการบริจาค',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  callback: async (client, interaction) => {
    const amount = interaction.options.getInteger('amount');
    const charity = interaction.options.getString('charity');
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;

    if (amount <= 0) {
      interaction.reply({ content: 'จำนวนเงินที่บริจาคต้องมากกว่า 0', ephemeral: true });
      return;
    }

    const user = await User.findOne({ userId, guildId });

    if (!user || user.balance < amount) {
      interaction.reply({ content: 'ยอดเงินคงเหลือในบัญชีไม่พอ', ephemeral: true });
      return;
    }

    user.balance -= amount;
    await user.save();

    // Create donation slip
    const backgroundUrl = 'https://arplanecorporation.github.io/cdn/moneyslip.png';
    let background;

    try {
      background = await loadImage(backgroundUrl);
    } catch (error) {
      console.warn(`Failed to load online image, falling back to local image. Error: ${error}`);
      background = await loadImage(path.join(__dirname, 'images', 'moneyslip.png'));
    }

    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Set text properties
    ctx.font = '60px Itim';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Get usernames without tags
    const senderUsername = interaction.user.username;
    const serverName = interaction.guild.name;

    // Add text (centered horizontally and vertically)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const lineHeight = 60 + 2.5 * 37.7953; // 60px font size + 5 cm in pixels

    ctx.fillText(`จาก: ${senderUsername}`, centerX, centerY - lineHeight * 2);
    ctx.fillText(`จำนวน: ${amount} บาท`, centerX, centerY - lineHeight);
    ctx.fillText(`บริจาคให้: ${charity}`, centerX, centerY);
    ctx.fillText(`เซิร์ฟเวอร์: ${serverName}`, centerX, centerY + lineHeight);

    const slip = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'slip.png' });

    // Informing the user that the donation was successful
    await interaction.reply({
      content: `บริจาคเงินจำนวน ${amount} บาท ให้กับ "${charity}" สำเร็จแล้ว\n ตรวจสอบสลิปบริจาคได้ที่ DMs`,
    });

    // Sending DM to the sender
    try {
      await interaction.user.send({
        content: `# รายการบริจาค\nบริจาค: จำนวน: ${amount} บาท ให้กับ: ${charity}\nเซิร์ฟเวอร์: ${serverName}`,
        files: [slip],
      });
    } catch (dmError) {
      console.error('Error sending DM:', dmError);
    }
  },
};
