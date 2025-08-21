import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  version: {
    fontSize: 16,
    color: '#666666',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },

  // Account
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  accountEmail: {
    fontSize: 16,
    color: '#000000',
  },
  editButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  points: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },

  // Menu rows
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  menuText: {
    fontSize: 16,
    color: '#000000',
  },
  arrow: {
    fontSize: 18,
    color: '#666666',
  },

  // Settings
  languageText: {
    fontSize: 16,
    color: '#666666',
  },

  // Consents
  toggleRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  footerVersion: {
    fontSize: 14,
    color: '#666666',
  },

  // Danger Zone
  dangerZone: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFF5F5',
    borderTopWidth: 1,
    borderTopColor: '#F0D0D0',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#B00020',
    marginBottom: 10,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#B00020',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#B00020',
    fontSize: 16,
    fontWeight: '700',
  },
  dangerText: {
    color: '#B00020',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalText: {
    fontSize: 16,
    color: '#000000',
  },
  modalCheck: {
    fontSize: 18,
  },
});

export default styles;
