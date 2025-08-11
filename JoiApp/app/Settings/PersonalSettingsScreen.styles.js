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
    fontWeight: '600',
    color: '#000000',
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  accountEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  editButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  languageText: {
    fontSize: 16,
    color: '#666666',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  footerVersion: {
    fontSize: 14,
    color: '#666666',
  },
});

export default styles;