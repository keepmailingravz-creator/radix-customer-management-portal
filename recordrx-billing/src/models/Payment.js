const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  billId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bill',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  billNumber: String,
  customerName: String,
  
  // Payment details
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'credit_card', 'debit_card', 'cheque', 'online', 'other'],
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  
  // Transaction details
  transactionId: String,
  referenceNumber: String,
  bankName: String,
  chequeNumber: String,
  chequeDate: Date,
  
  // Reconciliation
  reconciliationStatus: {
    type: String,
    enum: ['pending', 'matched', 'unmatched', 'disputed', 'resolved'],
    default: 'pending'
  },
  reconciliationDate: Date,
  reconciledBy: String,
  reconciliationNotes: String,
  
  // Bank statement matching
  bankStatementRef: String,
  bankStatementDate: Date,
  bankStatementAmount: Number,
  amountDifference: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'completed'
  },
  
  // Notes
  notes: String,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate payment ID
PaymentSchema.statics.generatePaymentId = async function() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const prefix = `PAY${year}${month}${day}`;
  
  const lastPayment = await this.findOne({ paymentId: new RegExp(`^${prefix}`) })
    .sort({ paymentId: -1 });
  
  let sequence = 1;
  if (lastPayment) {
    const lastSequence = parseInt(lastPayment.paymentId.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${sequence.toString().padStart(4, '0')}`;
};

PaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate amount difference for reconciliation
  if (this.bankStatementAmount) {
    this.amountDifference = this.bankStatementAmount - this.amount;
  }
  
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);
