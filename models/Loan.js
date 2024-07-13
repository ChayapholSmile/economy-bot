// models/Loan.js
const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  borrowerId: { type: String, required: true },
  lenderId: { type: String, required: true }, // 'bank' if the loan is from the bank
  amount: { type: Number, required: true },
  interest: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  repaid: { type: Boolean, default: false },
});

module.exports = mongoose.model('Loan', loanSchema);