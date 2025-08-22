import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFF', // soft tint similar to indigo-50/white/purple-50 blend
  },

  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4F46E5', // indigo-600
  },
  subtitle: {
    marginTop: 6,
    color: '#4B5563', // gray-600
    textAlign: 'center',
  },

  group: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151', // gray-700
    marginBottom: 6,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB', // gray-50
    borderWidth: 1,
  },
  inputWrapperNormal: {
    borderColor: '#E5E7EB', // gray-200
  },
  inputWrapperError: {
    borderColor: '#EF4444', // red-500
  },

  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#111827', // gray-900
    paddingVertical: 0,
  },

  errorText: {
    marginTop: 6,
    color: '#EF4444',
    fontSize: 12,
  },

  rightRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
  },
  link: {
    color: '#4F46E5',
    fontWeight: '600',
  },

  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonEnabled: {
    backgroundColor: '#4F46E5',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  signupRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: '#4B5563',
  },
  signupLink: {
    color: '#4F46E5',
    fontWeight: '700',
  },
});
