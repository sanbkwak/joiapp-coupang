import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E1E8ED',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#657786',
    textAlign: 'center',
    fontWeight: '600',
  },

  // --- Camera ---
  cameraContainer: {
    backgroundColor: 'black',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlayText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.85,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  // --- Content ---
  contentContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // --- Question ---
  questionContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#14171A',
    lineHeight: 26,
  },

  // --- Options ---
  optionsContainer: {
    marginHorizontal: 20,
  },
  optionButton: {
    backgroundColor: 'white',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E1E8ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  optionButtonSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F8FF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E1E8ED',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: '#4A90E2',
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4A90E2',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#657786',
    marginRight: 10,
    minWidth: 20,
    marginTop: 1,
  },
  optionLabelSelected: {
    color: '#4A90E2',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#14171A',
    lineHeight: 22,
  },
  optionTextSelected: {
    color: '#14171A',
    fontWeight: '500',
  },

  // --- Navigation ---
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  prevButton: {
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#657786',
  },
  nextButton: {
    backgroundColor: '#4A90E2',
  },
  nextButtonDisabled: {
    backgroundColor: '#E1E8ED',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  nextButtonTextDisabled: {
    color: '#657786',
  },
    // --- Privacy Disclaimer ---
  privacyMessageContainer: {
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  privacyMessageText: {
    fontSize: 12,
    color: '#657786',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default styles;
