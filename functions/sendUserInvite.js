const { onCall } = require('firebase-functions/v2/https');
const crypto = require('crypto');
const axios = require('axios');
const { admin, db } = require('./firebaseAdmin');

exports.sendUserInvite = onCall(
  {
    region: 'us-central1',
    secrets: ['MAILERSEND_API_KEY'],
  },
  async (request) => {
    const { auth, data } = request;
    console.log('🔍 FUNCTION INVOKED');
    console.log('Auth Context:', auth);

    if (!auth?.uid) {
      throw new Error('User not logged in');
    }

    const { fullName, email, role, companyId, baseUrl } = data;

    const senderDoc = await db.collection('users').doc(auth.uid).get();
    const senderData = senderDoc.data();

    if (!senderDoc.exists || senderData?.role !== 'Administrator') {
      throw new Error('Only administrators can send invites');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );

    await db.collection('userInvites').doc(token).set({
      fullName,
      email,
      role,
      companyId,
      status: 'Pending',
      inviteSentAt: admin.firestore.Timestamp.now(),
      token,
      expiresAt,
    });

    const safeBaseUrl = typeof baseUrl === 'string' ? baseUrl : 'https://hirecopilot.me';
    const link = `${safeBaseUrl}/register?token=${token}`;

    // MailerSend email payload
    const emailData = {
      from: {
        email: 'no-reply@hirecopilot.me',
        name: 'HireCopilot admin',
      },
      to: [{ email }],
      subject: 'You’re Invited to Join HireCopilot',
      html: `
        <p>Hi ${fullName},</p>
        <p>You’ve been invited to join <strong>HireCopilot</strong>.</p>
        <p>Please click the link below to register. This link will expire in 24 hours.</p>
        <p><a href="${link}">${link}</a></p>
        <p>If you weren’t expecting this invite, you can safely ignore it.</p>
      `,
    };

    try {
      await axios.post('https://api.mailersend.com/v1/email', emailData, {
        headers: {
          Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      return { success: true };
    } catch (error) {
      console.error('MailerSend Error:', error?.response?.data || error.message);
      throw new Error('Failed to send email: ' + (error?.response?.data?.message || error.message));
    }
  }
);

