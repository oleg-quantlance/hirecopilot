// functions/adminDeleteUser.js
const { onCall } = require('firebase-functions/v2/https');
const { admin, db } = require('./firebaseAdmin');

exports.adminDeleteUser = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    const { auth, data } = request;
    const { targetUid } = data;

    if (!auth?.uid) {
      throw new Error('User not logged in');
    }

    const adminDoc = await db.collection('users').doc(auth.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'Administrator') {
      throw new Error('Only administrators can delete users');
    }

    // Disable the Firebase Auth user
    try {
      await admin.auth().updateUser(targetUid, { disabled: true });
      console.log(`✅ Auth user disabled: ${targetUid}`);
    } catch (err) {
      console.error('Error disabling user in Auth:', err.message);
      throw new Error('Failed to disable user in Auth');
    }

    // Delete Firestore user document
    try {
      await db.collection('users').doc(targetUid).delete();
      console.log(`🗑️ Firestore doc deleted: ${targetUid}`);
    } catch (err) {
      console.error('Error deleting Firestore user:', err.message);
      throw new Error('Failed to delete user from Firestore');
    }

    return { success: true };
  }
);

