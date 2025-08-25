import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // progress
  progressTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 12,
  },
  progressFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 999 },

  // step pill
  stepPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 8,
    marginBottom: 14,
  },
  stepPillText: { color: 'white', fontWeight: '700' },

  // hero
  hero: { alignItems: 'center', marginBottom: 12 },
  heroIcon: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroIconEmoji: { fontSize: 34, color: '#FFFFFF' },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#111827' },
  heroSubtitle: { marginTop: 8, fontSize: 16, color: '#6B7280', textAlign: 'center' },

  // feature card
  featureCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 18,
    borderLeftWidth: 6,
    marginTop: 18,
  },
  featureEmojiWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureEmoji: { fontSize: 28 },
  featureTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center', color: '#111827' },
  featureSubtitle: { marginTop: 8, textAlign: 'center', color: '#6B7280', fontSize: 15 },

  // step 2 titles
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionSubtitle: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 12,
    fontSize: 16,
  },

  // input card
  inputCard: { backgroundColor: '#F3F4F6', borderRadius: 20, padding: 16, marginTop: 8 },
  inputQuestion: { fontSize: 22, fontWeight: '800', textAlign: 'center', color: '#111827', marginTop: 4 },
  inputSub: { textAlign: 'center', color: '#6B7280', marginTop: 4, marginBottom: 14 },

  // 2x2 grid of input methods
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  inputButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: { fontSize: 28, marginBottom: 6 },
  inputLabel: { fontSize: 18, fontWeight: '700', color: '#111827' },

  // emoji row (fixed horizontal alignment)
  emojiRow: { flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 18 },
  emoji: { fontSize: 32 },

  // key list
  keyListWrap: { marginTop: 18 },
  keyListTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  keyItem: { marginTop: 8, color: '#374151', fontSize: 16 },

  // CTA
  ctaPrimary: {
    marginTop: 22,
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  ctaPrimaryText: { color: 'white', fontWeight: '800', fontSize: 18 },
});
