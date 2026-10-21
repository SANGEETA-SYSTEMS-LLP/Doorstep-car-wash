# Washer payout setup

Washers enter their account holder name, account number and IFSC in Profile → Payment & payout details. The backend creates a RazorpayX contact and bank fund account and links it to the authenticated washer. Only the provider fund-account ID and a masked label are stored locally; customers never receive bank details.

Configure these server-only values in `backend/.env`:

```dotenv
RAZORPAYX_KEY_ID=your_razorpayx_key
RAZORPAYX_KEY_SECRET=your_razorpayx_secret
RAZORPAYX_ACCOUNT_NUMBER=your_razorpayx_business_account_number
```

Restart the backend after configuring them. The last value is the platform's source account, not the washer's account number. RazorpayX must be enabled for the business. Customer checkout continues using the existing `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and webhook configuration. Keep test and live environments consistent.

After service confirmation, the customer sees the assigned washer's name and Razorpay checkout. Pay-after-service bookings can be paid online at this stage. Already-paid bookings cannot create another payment. The backend verifies captured payments and records eligible washer earnings; finance users process payouts through the existing reserved-operation workflow. Checkout does not automatically transfer money to a washer.

Test with provider test credentials: add a washer bank account, confirm a completed booking, complete Razorpay checkout, verify the paid state and washer earnings, then have a finance user prepare/reconcile a payout. No live funds were moved during implementation.

Provider references: [Contacts and fund accounts](https://razorpay.com/docs/x/contacts-fund-accounts/) and [RazorpayX API](https://razorpay.com/docs/api/x/).
