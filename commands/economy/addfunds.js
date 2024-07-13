const { Client, Interaction, ApplicationCommandOptionType, AttachmentBuilder } = require('discord.js');
const { registerFont, createCanvas, loadImage } = require('canvas');
const path = require('path');
const User = require('../../models/User');
const config = require('../../config.json');

// Register custom font
registerFont(path.join(__dirname, 'fonts', 'Itim-Regular.ttf'), { family: 'Itim' });

module.exports = {
  name: 'addfunds',
  description: 'เพิ่มเงินให้กับผู้ใช้ (สำหรับผู้พัฒนาเท่านั้น)',

  options: [
    {
      name: 'target',
      description: 'ผู้ใช้ที่คุณต้องการเพิ่มเงินให้',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'amount',
      description: 'จำนวนเงินที่คุณต้องการเพิ่ม',
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
    {
      name: 'source',
      description: 'ชื่อบัญชีต้นทาง',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'memo',
      description: 'บันทึกช่วยจำสำหรับการเพิ่มเงินครั้งนี้',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],

  callback: async (client, interaction) => {
    if (!config.devs.includes(interaction.user.id)) {
      await interaction.reply({
        content: 'คุณไม่มีสิทธิ์ใช้คำสั่งนี้',
        ephemeral: true,
      });
      return;
    }

    if (!interaction.inGuild()) {
      await interaction.reply({
        content: 'คุณสามารถใช้คำสั่งนี้ได้เฉพาะในเซิร์ฟเวอร์เท่านั้น',
        ephemeral: true,
      });
      return;
    }

    const targetUserId = interaction.options.getUser('target')?.id;
    const amount = interaction.options.getInteger('amount');
    const source = interaction.options.getString('source');
    let memo = interaction.options.getString('memo') || 'ไม่มีบันทึกช่วยจำ';

    // Limit memo length to 30 characters per line and 2 lines max
    if (memo.length > 30) {
      memo = memo.match(/.{1,30}/g).slice(0, 2).join('\n');
      if (memo.length > 60) {
        memo = memo.substring(0, 57) + '...';
      }
    }

    if (!targetUserId || amount <= 0) {
      await interaction.reply({
        content: 'โปรดระบุผู้ใช้ที่ต้องการเพิ่มเงินและจำนวนเงินที่ถูกต้อง',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const targetUser = await User.findOne({ userId: targetUserId, guildId: interaction.guild.id });

      if (!targetUser) {
        await interaction.editReply({
          content: 'ผู้รับไม่มีบัญชีในระบบ',
        });
        return;
      }

      targetUser.balance += amount;
      await targetUser.save();

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
      const recipientUsername = client.users.cache.get(targetUserId).username;
      const serverName = interaction.guild.name;

      // Add text (centered horizontally and vertically)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const lineHeight = 60 + (2.5 / 2.54) * 37.7953; // 60px font size + 5 cm in pixels

      ctx.fillText(`จาก: ${source}`, centerX, centerY - lineHeight * 2);
      ctx.fillText(`ถึง: ${recipientUsername}`, centerX, centerY - lineHeight);
      ctx.fillText(`จำนวน: ${amount} บาท`, centerX, centerY);
      ctx.fillText(`บันทึกช่วยจำ: ${memo}`, centerX, centerY + lineHeight);

      const slip = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'slip.png' });

      // Informing the user that the transaction was successful
      await interaction.editReply({
        content: `เพิ่มเงินจำนวน ${amount} บาท ให้ <@${targetUserId}> สำเร็จแล้ว\nตรวจสอบสลิปการเพิ่มเงินได้ที่ DMs`,
      });

      // Sending DM to the recipient
      try {
        const recipient = await client.users.fetch(targetUserId);
        await recipient.send({
          content: `# รายการเงินเข้า\nเงินเข้า: จากบัญชี: ${source} จำนวน: ${amount} บาท\nบันทึกช่วยจำ: ${memo}\nมาจากเซิร์ฟเวอร์: ${serverName}`,
          files: [slip],
        });

        // Sending DM to the sender
        await interaction.user.send({
          content: `# รายการเติมเงิน\nเงินเพิ่ม: จำนวน: ${amount} บาท ไปยัง: ${recipientUsername}\nบันทึกช่วยจำ: ${memo}\nมาจากเซิร์ฟเวอร์: ${serverName}`,
          files: [slip],
        });
      } catch (dmError) {
        console.error('Error sending DM:', dmError);
      }
    } catch (error) {
      console.error('Error occurred during add funds command:', error);
      await interaction.editReply({
        content: 'เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง',
      });
    }
  },
};
