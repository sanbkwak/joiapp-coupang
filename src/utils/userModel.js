import { db } from '../firebaseConfig';
import {
 doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Checks if a user exists in Firestore by public key.
 * @param {string} publicKey The user's public key.
 * @returns {Promise<{exists: boolean, id?: string, data?: any}>} Object indicating if the user exists, and their data if they do.
 */
 

/**
 * Creates a new user in Firestore.
 * @param {string} publicKey The user's public key.
 * @returns {Promise<void>}
 */
export const createUser = async (publicKey) => {
  const userRef = doc(db, 'users', publicKey); // Set the document ID to the publicKey

  await setDoc(userRef, {
    publicKey: publicKey,
    numberOfLogins: 1,
    lastLogin: serverTimestamp(), // Use Firestore server timestamp
  });
};

/**
 * Called after a successful sign-in (email/password or social).
 * Creates or updates the user record.
 */
// When a user logs in via email/password or popup,
export const handleUserLogin = async (userId) => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data();
    const newCount = (data.numberOfLogins || 0) + 1;

    await updateDoc(userRef, {
      numberOfLogins: newCount,
      lastLogin:     serverTimestamp(),
      JoiPoints:     newCount * 5,
    });
  } else {
    // First-time registration
    await createUserFirebase(userId);
  }
};

/**
 * Create the initial user document.
 */
export const createUserFirebase = async (userId) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    numberOfLogins: 0,
    lastLogin: serverTimestamp(),
    JoiPoints: 0,
  });
};
export const updateUserLoginFirebase = async (publicKey, loginCount) => {
  const userRef = doc(db, 'users', publicKey); // Use publicKey as the document ID

  // Check if loginCount is NaN and set it to zero if it is
  if (isNaN(loginCount)) {
    loginCount = 0;
  }

  console.log("in updateLogin loginCount: ", loginCount);

  await updateDoc(userRef, {
    numberOfLogins: loginCount + 1,
    lastLogin: serverTimestamp(),
  });
};
/**
 * Updates the login count and last login time for an existing user.
 * @param {string} userId The Firestore document ID of the user.
 * @param {number} loginCount The current number of logins to increment.
 * @returns {Promise<void>}
 */
export const updateUserLoginFirestore = async (userId, loginCount) => {
  const userRef = doc(db, 'users', userId); // Use publicKey as the document ID

  // Check if loginCount is NaN and set it to zero if it is
  if (isNaN(loginCount)) {
    loginCount = 0;
  }

  console.log("in updateLogin loginCount: ", loginCount);

  await updateDoc(userRef, {
    numberOfLogins: loginCount + 1,
    lastLogin: serverTimestamp(),
  });
};
