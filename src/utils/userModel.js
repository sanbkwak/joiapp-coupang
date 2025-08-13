import { db } from '../firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from 'firebase/firestore';

/**
 * Checks if a user exists in Firestore by user ID.
 * @param {string} userId The user's Firebase UID.
 * @returns {Promise<{exists: boolean, data?: any}>} Object indicating if the user exists, and their data if they do.
 */
export const checkUserExistsFirestore = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { exists: true, data: userDoc.data() };
    } else {
      return { exists: false };
    }
  } catch (error) {
    console.error('Error checking user existence:', error);
    throw error;
  }
};

/**
 * Creates a new user in Firestore with default settings and consents.
 * @param {string} userId The user's Firebase UID.
 * @param {Object} additionalData Additional user data to store.
 * @returns {Promise<void>}
 */
export const createUser = async (userId, additionalData = {}) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const defaultUserData = {
      userId: userId,
      numberOfLogins: 1,
      lastLogin: serverTimestamp(),
      JoiPoints: 5, // Initial points for signing up
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      // Settings
      settings: {
        language: 'English',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        privacy: {
          profileVisibility: 'private',
          dataSharing: false,
        },
      },
      
      // Consents with timestamps
      consents: {
        dataUsage: {
          granted: false,
          timestamp: serverTimestamp(),
          version: '1.0',
        },
        withdrawConsent: {
          granted: false,
          timestamp: serverTimestamp(),
          version: '1.0',
        },
        termsOfService: {
          granted: false,
          timestamp: null,
          version: null,
        },
        privacyPolicy: {
          granted: false,
          timestamp: null,
          version: null,
        },
        joiDataValuation: {
          granted: false,
          timestamp: null,
          version: null,
        },
      },
      
      // Camera and microphone permissions
      devicePermissions: {
        camera: {
          granted: false,
          timestamp: null,
        },
        microphone: {
          granted: false,
          timestamp: null,
        },
      },
      
      ...additionalData,
    };

    await setDoc(userRef, defaultUserData);
    
    // Log the user creation event
    await logUserActivity(userId, 'user_created', { initialData: defaultUserData });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Called after a successful sign-in (email/password or social).
 * Creates or updates the user record.
 */
export const handleUserLogin = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      const newCount = (data.numberOfLogins || 0) + 1;

      await updateDoc(userRef, {
        numberOfLogins: newCount,
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
        JoiPoints: (data.JoiPoints || 0) + 5, // 5 points per login
      });
      
      // Log the login event
      await logUserActivity(userId, 'user_login', { loginCount: newCount });
    } else {
      // First-time registration
      await createUser(userId);
    }
  } catch (error) {
    console.error('Error handling user login:', error);
    throw error;
  }
};

/**
 * Updates user consent for a specific consent type.
 * @param {string} userId The user's Firebase UID.
 * @param {string} consentType The type of consent (dataUsage, withdrawConsent, etc.).
 * @param {boolean} granted Whether consent is granted.
 * @param {string} version The version of the consent agreement.
 * @returns {Promise<void>}
 */
export const updateUserConsent = async (userId, consentType, granted, version = '1.0') => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const consentUpdate = {
      [`consents.${consentType}.granted`]: granted,
      [`consents.${consentType}.timestamp`]: serverTimestamp(),
      [`consents.${consentType}.version`]: version,
      updatedAt: serverTimestamp(),
    };
    
    // Award points for granting consents
    if (granted) {
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentPoints = userDoc.data().JoiPoints || 0;
        consentUpdate.JoiPoints = currentPoints + 10; // 10 points for each consent
      }
    }
    
    await updateDoc(userRef, consentUpdate);
    
    // Log the consent change
    await logUserActivity(userId, 'consent_updated', {
      consentType,
      granted,
      version,
    });
  } catch (error) {
    console.error('Error updating user consent:', error);
    throw error;
  }
};

/**
 * Updates user device permissions.
 * @param {string} userId The user's Firebase UID.
 * @param {string} deviceType The type of device (camera, microphone).
 * @param {boolean} granted Whether permission is granted.
 * @returns {Promise<void>}
 */
export const updateDevicePermission = async (userId, deviceType, granted) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const permissionUpdate = {
      [`devicePermissions.${deviceType}.granted`]: granted,
      [`devicePermissions.${deviceType}.timestamp`]: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(userRef, permissionUpdate);
    
    // Log the permission change
    await logUserActivity(userId, 'device_permission_updated', {
      deviceType,
      granted,
    });
  } catch (error) {
    console.error('Error updating device permission:', error);
    throw error;
  }
};

/**
 * Updates user settings.
 * @param {string} userId The user's Firebase UID.
 * @param {string} settingPath The path to the setting (e.g., 'language', 'notifications.email').
 * @param {any} value The new value for the setting.
 * @returns {Promise<void>}
 */
export const updateUserSetting = async (userId, settingPath, value) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    const settingUpdate = {
      [`settings.${settingPath}`]: value,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(userRef, settingUpdate);
    
    // Log the setting change
    await logUserActivity(userId, 'setting_updated', {
      settingPath,
      value,
    });
  } catch (error) {
    console.error('Error updating user setting:', error);
    throw error;
  }
};

/**
 * Gets all user consents.
 * @param {string} userId The user's Firebase UID.
 * @returns {Promise<Object>} Object containing all user consents.
 */
export const getUserConsents = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.consents || {};
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error getting user consents:', error);
    throw error;
  }
};

/**
 * Gets user settings.
 * @param {string} userId The user's Firebase UID.
 * @returns {Promise<Object>} Object containing all user settings.
 */
export const getUserSettings = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.settings || {};
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
};

/**
 * Gets user device permissions.
 * @param {string} userId The user's Firebase UID.
 * @returns {Promise<Object>} Object containing all device permissions.
 */
export const getUserDevicePermissions = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.devicePermissions || {};
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error getting device permissions:', error);
    throw error;
  }
};

/**
 * Handles consent withdrawal process.
 * @param {string} userId The user's Firebase UID.
 * @returns {Promise<void>}
 */
export const handleConsentWithdrawal = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Update all consents to withdrawn
    const withdrawalUpdate = {
      'consents.dataUsage.granted': false,
      'consents.dataUsage.timestamp': serverTimestamp(),
      'consents.withdrawConsent.granted': true,
      'consents.withdrawConsent.timestamp': serverTimestamp(),
      'consents.termsOfService.granted': false,
      'consents.privacyPolicy.granted': false,
      'consents.joiDataValuation.granted': false,
      updatedAt: serverTimestamp(),
      consentWithdrawnAt: serverTimestamp(),
    };
    
    await updateDoc(userRef, withdrawalUpdate);
    
    // Log the consent withdrawal
    await logUserActivity(userId, 'consent_withdrawn', {
      withdrawnAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error handling consent withdrawal:', error);
    throw error;
  }
};

/**
 * Logs user activity for audit purposes.
 * @param {string} userId The user's Firebase UID.
 * @param {string} action The action performed.
 * @param {Object} metadata Additional metadata about the action.
 * @returns {Promise<void>}
 */
export const logUserActivity = async (userId, action, metadata = {}) => {
  try {
    const activityRef = collection(db, 'userActivity');
    
    await addDoc(activityRef, {
      userId,
      action,
      metadata,
      timestamp: serverTimestamp(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      ipAddress: null, // Would need server-side implementation
    });
  } catch (error) {
    console.error('Error logging user activity:', error);
    // Don't throw error to avoid breaking user flow
  }
};

/**
 * Gets user activity log.
 * @param {string} userId The user's Firebase UID.
 * @param {number} limit The maximum number of activities to return.
 * @returns {Promise<Array>} Array of user activities.
 */
export const getUserActivityLog = async (userId, limit = 50) => {
  try {
    const activityRef = collection(db, 'userActivity');
    const q = query(
      activityRef,
      where('userId', '==', userId)
      // Note: To use orderBy and limit, you need to create a composite index in Firestore
      // orderBy('timestamp', 'desc'),
      // limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const activities = [];
    
    querySnapshot.forEach((doc) => {
      activities.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    // Sort by timestamp in memory (remove this if you use orderBy above)
    activities.sort((a, b) => {
      const aTime = a.timestamp?.toDate?.() || new Date(0);
      const bTime = b.timestamp?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
    
    return activities.slice(0, limit);
  } catch (error) {
    console.error('Error fetching user activity log:', error);
    return [];
  }
};

/**
 * Updates the login count and last login time for an existing user.
 * @param {string} userId The Firestore document ID of the user.
 * @param {number} loginCount The current number of logins to increment.
 * @returns {Promise<void>}
 */
export const updateUserLoginFirestore = async (userId, loginCount) => {
  try {
    const userRef = doc(db, 'users', userId);

    // Check if loginCount is NaN and set it to zero if it is
    if (isNaN(loginCount)) {
      loginCount = 0;
    }

    console.log("in updateLogin loginCount: ", loginCount);

    await updateDoc(userRef, {
      numberOfLogins: loginCount + 1,
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user login:', error);
    throw error;
  }
};

/**
 * Creates the initial user document (legacy function - use createUser instead).
 * @param {string} userId The user's Firebase UID.
 * @returns {Promise<void>}
 */
export const createUserFirebase = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      numberOfLogins: 0,
      lastLogin: serverTimestamp(),
      JoiPoints: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user (legacy):', error);
    throw error;
  }
};

/**
 * Legacy function for updating login count by public key.
 * @deprecated Use updateUserLoginFirestore with userId instead.
 * @param {string} publicKey The user's public key (deprecated).
 * @param {number} loginCount The current login count.
 * @returns {Promise<void>}
 */
export const updateUserLoginFirebase = async (publicKey, loginCount) => {
  try {
    console.warn('updateUserLoginFirebase is deprecated. Use updateUserLoginFirestore with userId instead.');
    const userRef = doc(db, 'users', publicKey);

    if (isNaN(loginCount)) {
      loginCount = 0;
    }

    console.log("in updateLogin loginCount: ", loginCount);

    await updateDoc(userRef, {
      numberOfLogins: loginCount + 1,
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user login (legacy):', error);
    throw error;
  }
};

/**
 * Gets complete user profile including all data, settings, consents, and permissions.
 * @param {string} userId The user's Firebase UID.
 * @returns {Promise<Object>} Complete user profile object.
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Initializes a user with minimal required data if they don't exist.
 * @param {string} userId The user's Firebase UID.
 * @returns {Promise<void>}
 */
export const initializeUserIfNeeded = async (userId) => {
  try {
    const { exists } = await checkUserExistsFirestore(userId);
    
    if (!exists) {
      await createUser(userId);
      console.log('User initialized:', userId);
    }
  } catch (error) {
    console.error('Error initializing user:', error);
    throw error;
  }
};