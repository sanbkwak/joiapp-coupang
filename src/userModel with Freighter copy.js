import { db } from './firebaseConfig';
import {
  collection,
  setDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

/**
 * Checks if a user exists in Firestore by public key.
 * @param {string} publicKey The user's public key.
 * @returns {Promise<{exists: boolean, id?: string, data?: any}>} Object indicating if the user exists, and their data if they do.
 */
export const checkUserExists = async (publicKey) => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where('publicKey', '==', publicKey));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // Return the first user found (publicKey should be unique)
    const userDoc = querySnapshot.docs[0];
    return { exists: true, id: userDoc.id, data: userDoc.data() };
  }

  return { exists: false };
};

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
export const createUserFirebase = async ( ) => {
  const userRef = doc(db, 'users');  

  await setDoc(userRef, {
 
    numberOfLogins: 1,
    lastLogin: serverTimestamp(), // Use Firestore server timestamp
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
export const updateUserLogin = async (publicKey, loginCount) => {
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
