const mongoose = require('mongoose');

// สร้าง Schema สำหรับ Item
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  creatorId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ตรวจสอบว่ามีโมเดล 'Item' อยู่แล้วหรือไม่
const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);

module.exports = Item;
