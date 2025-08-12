import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from './utils/logout.js';
import { auth, db } from './firebaseConfig';
import { collection, addDoc, query, doc,  getDocs, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './css/QuestionsPage.css';
import { GAD7_QUESTIONS, PHQ9_QUESTIONS, GAD2_QUESTIONS, PHQ2_QUESTIONS, ANSWER_OPTIONS, questionList1, questionList2, YES_NO_OPTIONS } from './utils/questions.js';
//import { getPublicKey } from '@stellar/freighter-api';
import JoiAppLogo from './joiapplogo.png'; 
import { Link } from 'react-router-dom';
import { getAuth } from "firebase/auth";



const QuestionsPage = () => {
    const navigate = useNavigate();
    const logout = useLogout();
  //  const userPublicKey = localStorage.getItem('userPublicKey');
    const [answers, setAnswers] = useState({});
    const [currentQuestionSet, setCurrentQuestionSet] = useState('PHQ2_GAD2_QuestionList1');
    const [isCameraEnabled, setIsCameraEnabled] = useState(false); // State to track if camera is enabled
   
    const [isRecordingCompleted, setIsRecordingCompleted] = useState(false); // State to track if recording is completed
    const [isRecording, setIsRecording] = useState(false);
   
    const [isWaitingForResults, setIsWaitingForResults] = useState(false); // State to track if waiting for server results
    const [results, setResults] = useState({
        dominant_emotions: [],
        results: []
    });

    const [isWaitingForVoiceResults, setIsWaitingForVoiceResults] = useState(false);
    const [results_voice, setVoiceResults] = useState({
        dominant_emotions: [],
        results: []
    });

    const mediaStream  = useRef(null);
    const audioStream = useRef(null);
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
 
    const audioMediaRecorderRef = useRef(null);
    const recordedAudioChunksRef = useRef([]);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isVoiceQuestionsActive, setIsVoiceQuestionsActive] = useState(false);

    const [recordingLog, setRecordingLog] = useState([]);
    const [isPHQ9Completed, setIsPHQ9Completed] = useState(false);

    const [showConsentModal, setShowConsentModal] = useState(false);
const [consentType, setConsentType] = useState(null); // 'camera' or 'microphone'

const [consentState, setConsentState] = useState({
  camera: true,
  microphone: true,
  voiceRecording: true,
  emotionAI: false,
  surveySubmission: true,
});

  // 1) create a ref container for all text inputs
  const inputRefs = useRef({});
const auth = getAuth();
const user = auth.currentUser;


    const [userId, setUserId] = useState(null);
    const recognition = useMemo(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRecognition();
       rec.lang = 'ko-KR'; // Set language to Korean for the questions
    //    rec.lang = 'en-US';
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        return rec;
    }, []);
    recognition.lang = 'ko-KR'; // Set language to Korean for the questions
// recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const disableMedia = useCallback(() => {
        if (mediaStream.current) {
            mediaStream.current.getTracks().forEach(track => track.stop());
            mediaStream.current = null;
            setIsCameraEnabled(false);
 
            console.log("Media stream disabled.");
        }
    }, []);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                console.error("User not authenticated");
                navigate('/');
            }
        });

        return () => {
            unsubscribe();
            disableMedia(); // Clean up when the component is unmounted
        };
    }, [navigate, disableMedia]);

            useEffect(() => {
            const fetchConsents = async () => {
                if (!user?.uid) return;

                try {
                const docRef = doc(db, "users", user.uid, "currentConsents");
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setConsentState(snap.data());
                }
                } catch (error) {
                console.error("Consent fetch error:", error);
                }
            };

            fetchConsents();
            }, [user?.uid]);


    const handleMediaPermissions = async () => {
            // ① Don’t even ask the browser if the user has revoked camera consent
        if (!consentState.camera) {
        alert("카메라 사용에 동의하지 않으셨습니다. 설정에서 허용해주세요.");
        return;
        }
        try {
            mediaStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream.current;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    console.log("카메라와 마이크를 활성화.");
                };
                setIsCameraEnabled(true);
     
                startRecording(); // If applicable
                addLog("카메라와 마이크를 활성화");
                if (userId) {
                await addDoc(collection(db, "users", userId, "consents"), {
                type: "camera",
                granted: true,
                timestamp: new Date()
                });
            }
            } else {
                console.error("Video reference is not defined.");
            }
        } catch (error) {
            console.error("카메라와 마이크를 활성화 해주세요", error);
            alert("카메라와 마이크를 활성화 해주세요.");
        }
    };
    const handleAudioMediaPermissions = async () => {
            // ① Don’t even ask the browser if the user has revoked mic consent
        if (!consentState.microphone) {
        alert("마이크 사용에 동의하지 않으셨습니다. 설정에서 허용해주세요.");
        return;
        }
        try {
            // Request access to the microphone only
            mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    
            if (mediaStream.current) {
                console.log("마이크 활성화.");
    
                // Optionally, start recording if needed
                startRecording(); // If applicable
    
                // Update log and state accordingly
                addLog("마이크 활성화");
                      // ✅ Log Microphone Consent in Firestore
                if (userId) {
                    await addDoc(collection(db, "users", userId, "consents"), {
                    type: "microphone",
                    granted: true,
                    timestamp: new Date()
                    });
                }
            } else {
                console.error("Media stream could not be created.");
            }
        } catch (error) {
            console.error("Unable to access the microphone:", error);
            alert("마이크 활성화 허락");
        }
    };
    const stopAllMedia = () => {
        // Stop media stream (camera and microphone)
        if (mediaStream.current) {
            mediaStream.current.getTracks().forEach(track => {
                track.stop();
            });
            console.log("Camera and microphone have been stopped.");
        } else {
            console.warn("No active media stream to stop.");
        }
    
        // Stop audio recording if it's ongoing
        if (audioMediaRecorderRef.current && audioMediaRecorderRef.current.state !== "inactive") {
            audioMediaRecorderRef.current.stop();
            console.log("Audio recording has been stopped.");
        } else {
            console.warn("No active recording to stop.");
        }
    };
    // Function to start audio recording
    const startAudioRecording = async () => {
            // ① Skip entirely if user revoked mic consent
        if (!consentState.microphone) {
            console.warn("마이크 사용 동의가 없어 녹음을 시작하지 않습니다.");
            return;
            }
            console.log("in startAudioRecording");
            audioStream.current = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });

        if (audioStream.current) {
            console.log("in startAudioRecording audioStream.curren");
            // List of MIME types to check for compatibility
            const supportedMimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4'];
            let mimeType = '';
    
            // Find a supported MIME type
            for (let type of supportedMimeTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    break;
                }
            }
    
            // If no MIME type is supported, log an error and return
            if (!mimeType) {
                console.error("No supported MIME type found for MediaRecorder");
                return;
            }
    
            console.log(`Using MIME type: ${mimeType}`);
            
            try {
                const audioMediaRecorder = new MediaRecorder(audioStream.current, { mimeType });
                audioMediaRecorderRef.current = audioMediaRecorder;
                console.log("in startAudioRecording audioMediaRecorderRef.current = audioMediaRecorder");
    
                audioMediaRecorder.onerror = (event) => {
                    console.error("Error with MediaRecorder:", event.error);
                };

                audioMediaRecorder.ondataavailable = (event) => {
                    if (event.data && event.data.size > 0) {
                        recordedAudioChunksRef.current.push(event.data);
                    }
                };
                console.log("in startAudioRecording audioMediaRecorder.ondataavailable set");
    
                audioMediaRecorder.start();
                console.log("Audio recording started.");
    
                audioMediaRecorder.onstop = async () => {
                    console.log('Audio recording stopped.');
                    const audioBlob = new Blob(recordedAudioChunksRef.current, { type: mimeType });
                    recordedAudioChunksRef.current = [];
    
                    // Handle upload logic here
                    await handleAudioUpload(audioBlob);
                };
    
       
            } catch (error) {
                console.error("Error starting MediaRecorder:", error);
            }
        } else {
            console.error("Media stream is not available.");
        }
    };
    
    const pauseAudioRecording = () => {
        if (audioMediaRecorderRef.current && isRecording && !isPaused) {
            try {
                audioMediaRecorderRef.current.pause();
                console.log("Audio recording paused.");
                setIsPaused(true);
            } catch (error) {
                console.error("Error pausing MediaRecorder:", error);
            }
        }
    };
    
    const resumeAudioRecording = () => {
        if (audioMediaRecorderRef.current && isRecording && isPaused) {
            try {
                audioMediaRecorderRef.current.resume();
                console.log("Audio recording resumed.");
                setIsPaused(false);
            } catch (error) {
                console.error("Error resuming MediaRecorder:", error);
            }
        }
    };
    
    // Start Voice Recognition and Audio Recording Together
    const startVoiceRecognition = useCallback((question) => {
        recognition.abort(); // Stops any ongoing recognition

        // Start Audio Recording
      //  startAudioRecording(); // Start recording audio

        // Start Voice Recognition
 
        recognition.start();
        setIsVoiceActive(true);
        console.log("Voice recognition started.");
        if (audioMediaRecorderRef.current) { 
            resumeAudioRecording() 
        };

        recognition.onresult = (event) => {
            const voiceAnswer = event.results[0][0].transcript;
            setAnswers((prevAnswers) => ({
                ...prevAnswers,
                [question]: voiceAnswer,
            }));
            console.log(`Transcribed Text: ${voiceAnswer}`);
            setIsVoiceActive(false);
        };

        recognition.onspeechend = () => {
            recognition.stop(); // Stop recognition when user stops speaking
            console.log("Speech ended.");
        };

        recognition.onend = () => {
            setIsVoiceActive(false);
            if (audioMediaRecorderRef.current) {
                pauseAudioRecording();// Stop audio recording when recognition ends
            }
            console.log("Recognition ended.");
        };

        recognition.onerror = (event) => {
            console.error("Voice recognition error:", event.error);
            alert("Voice recognition Failed. Please try again");
            setIsVoiceActive(false);
            if (audioMediaRecorderRef.current) {
                pauseAudioRecording();
            }
        };
    }, [recognition, setAnswers]);


const handleAudioUpload = async (audioBlob) => {
  if (!audioBlob || audioBlob.size === 0) {
    console.error("Audio is too short or empty. Please record a longer audio.");
    return;
  }

  const formData = new FormData();
  formData.append('audio', audioBlob, 'recordedAudio.webm');
  formData.append('userId', userId);

  setIsWaitingForVoiceResults(true); // Show waiting indicator

  // Fire-and-forget to the Coupang Flask endpoint
   const API_URL = "https://api.joiapp.org"; // or "http://localhost:8080" in dev
  //  const API_URL = "http://localhost:8080";
  fetch(`${API_URL}/coupang/analyzeVoice`, {
    method: 'POST',
    body: formData
  })
    .then((res) => {
      if (!res.ok) {
        // If server responded with an error status, log it
        res.text().then(text => {
          addLog(`Audio upload failed: ${res.status} ${res.statusText} – ${text}`);
        });
      } else {
        addLog("Voice analysis request sent successfully.");
      }
    })
    .catch((err) => {
      console.error("Error uploading audio:", err);
      addLog(`Error uploading audio: ${err.message}`);
    })
    .finally(() => {
      setIsWaitingForVoiceResults(false); // Hide waiting indicator
    });

  // We do not await anything here. As soon as fetch() is triggered,
  // this function returns and the UI can continue.
};
    const stopAudioRecording = () => {
        if (audioMediaRecorderRef.current && isRecording) {
            try {
                audioMediaRecorderRef.current.stop();
                console.log("Audio recording stopped.");
            } catch (error) {
                console.error("Error stopping MediaRecorder:", error);
            }
            setIsRecording(false);
        }
    };
    const startRecording = () => {


        // ① Skip entirely if user revoked camera consent
        if (!consentState.camera) {
        console.warn("카메라 사용 동의가 없어 녹화를 시작하지 않습니다.");
        return;
        }
        // ② Also bail if there's no live video stream
        if (!videoRef.current?.srcObject) {
        console.error("녹화할 비디오 스트림이 없습니다. 녹화를 건너뜁니다.");
        return;
        }
        
        // Make sure we have a valid stream in videoRef.current.srcObject
        const recorder = new MediaRecorder(videoRef.current.srcObject, {
          mimeType: 'video/webm'
        });
      
        // Store it in your ref:
        mediaRecorderRef.current = recorder;
      
        // Set up event handlers
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
            addLog('Data available: ' + event.data.size + ' bytes');
          } else {
            addLog('No data or data size is 0');
          }
        };
      
        recorder.onstop = async () => {
          const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          recordedChunksRef.current = [];
          if (videoBlob.size === 0) {
            addLog('Video too short or empty. Please record a longer video.');
            return;
          }
          await handleVideoUpload(videoBlob);
        };
      
        // Actually start recording:
        recorder.start();
      
        setRecordingLog((prevLog) => [...prevLog, "Video recording started."]);
        addLog("Recording started.");
        console.log("Video recording started.");
      };
/*
    const startRecording = () => {
        if (!videoRef.current || !videoRef.current.srcObject) {
            alert("Please enable camera and microphone first.");
            return;
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const recorder = new MediaRecorder(videoRef.current.srcObject, { mimeType: 'video/webm' });

            mediaRecorderRef.current = recorder;
            
            recorder.ondataavailable = event => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                    addLog('Data available: ' + event.data.size + ' bytes');
                } else {
                    addLog('No data available or data size is 0');
                }
            };

            recorder.start();

            setRecordingLog((prevLog) => [...prevLog, "Video recording started."]);
            console.log("Video recording started.");
            
            recorder.onstop = async () => {
               

                const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                recordedChunksRef.current = [];
        
                if (videoBlob.size === 0) {
                    addLog('Video too short or empty. Please record a longer video.');
                    return;

            
                }
                await handleVideoUpload(videoBlob);
        
            };

       
            addLog("Recording started.");
        } else {
            console.error("Media stream is not available.");
        }
    };
*/
const handleVideoUpload = async (videoBlob) => {
  // Log and mark that recording has stopped
  addLog('Recording stopped.');
  setIsRecordingCompleted(true);

  if (!userId) {
    addLog('User is not authenticated. Cannot upload video.');
    return;
  }
  addLog(`questionsPage: auth.currentUser.uid: ${userId}`);

  // Build the FormData exactly as before
  const formData = new FormData();
  formData.append('video', videoBlob, 'recordedVideo.webm');
  formData.append('userId', userId);

  // Instead of awaiting the fetch, we just fire it off and forget.
  // Any response‐level logging happens in .then() / .catch().
  setIsWaitingForResults(true); // (Optional) show spinner or similar.

 const API_URL = 'https://api.joiapp.org'; // or "http://localhost:8080" in dev
//   const API_URL = 'http://localhost:8080';


  fetch(`${API_URL}/coupang/analyzeVideo`, {
    method: 'POST',
    body: formData,
    // Note: we do not set headers here because FormData sets its own Content-Type
  })
    .then((res) => {
      if (!res.ok) {
        // Log the HTTP status text if the server responded with 4xx/5xx
        res.text().then(text => {
          addLog(`Video upload failed: ${res.status} ${res.statusText} ‒ ${text}`);
        });
      } else {
        addLog('Video analysis request sent successfully.');
      }
    })
    .catch((err) => {
      // Network or unexpected error
      console.error('Error uploading video:', err);
      addLog(`Error uploading video: ${err.message}`);
    })
    .finally(() => {
      // Turn off the spinner immediately (we’re “fire‐and‐forget”)
      setIsWaitingForResults(false);
    });

  // We do NOT await anything here. As soon as fetch() is kicked off,
  // this function returns and your UI can continue immediately.
};

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            try {
                mediaRecorderRef.current.stop();
                console.log("Video recording stopped.");
            } catch (error) {
                console.warn("Error stopping video recorder:", error);
            }
        } else {
            console.warn("mediaRecorderRef is null; no video recorder to stop.");
        }
    
        if (audioMediaRecorderRef.current) {
            try {
                audioMediaRecorderRef.current.stop();
                console.log("Audio recording stopped.");
            } catch (error) {
                console.warn("Error stopping audio recorder:", error);
            }
        } else {
            console.warn("audioMediaRecorderRef is null; no audio recorder to stop.");
        }
    
        disableMedia();
    };

const handleVoiceButtonClick = useCallback(
    async (question) => {
              // focus the corresponding input
      // ① Ensure mic consent before anything
      if (!consentState.microphone) {
        alert("음성 입력(마이크 사용)에 동의하지 않으셨습니다. 설정에서 허용해주세요.");
        return;
      }
      // focus the corresponding input
      const inputEl = inputRefs.current[question];
      if (inputEl) {
        inputEl.focus();
      }

      // now start media permission flow and recognition:
      if (!mediaStream.current) {
        await handleAudioMediaPermissions();
      }
      if (mediaStream.current) {
        if (!isRecording) {
          startAudioRecording();
          setIsRecording(true);
        }
        startVoiceRecognition(question);
      } else {
        alert("마이크에 접근할 수 없습니다. 권한을 확인해주세요.");
      }
    },
    [isRecording, startAudioRecording, startVoiceRecognition, handleAudioMediaPermissions,consentState.microphone]
  );

    

/*
    useEffect(() => {
        addLog("in useEffect)")
        if ( (currentQuestionSet === 'questionList1' || currentQuestionSet ==='questiionList2') && !isVoiceQuestionsActive) {
            setIsVoiceQuestionsActive(true);
            startAudioRecording();
            questionList2.forEach((question) => {
                startVoiceRecognition(question.question);
            });
        }
    }, [currentQuestionSet, isVoiceQuestionsActive, startVoiceRecognition]);
*/

    const handleAnswerChange = (question, value) => {
    // Only insist on camera if both consented and not yet enabled
        if (consentState.camera && !isCameraEnabled) {
            alert("카메라 사용에 동의하셨다면 활성화해주세요.");
            handleMediaPermissions();
            return;
        }
      //  setAnswers(prevAnswers => ({ ...prevAnswers, [question]: value }));
      setAnswers((prevAnswers) => {
        const updatedAnswers = { ...prevAnswers, [question]: value };

        // Start audio recording when the first answer is given
        if (!isRecording) {
            startAudioRecording();
            setIsRecording(true);
        }

        // Stop recording if all questions are answered
/*        if (areAllQuestionsAnswered(updatedAnswers)) {
            stopAudioRecording();
            setIsRecording(false);
        }
*/
        return updatedAnswers;
    });
    };

    const validateAnswers = () => {
        const requiredQuestions = currentQuestionSet === 'PHQ2_GAD2_QuestionList1'
            ? [...PHQ2_QUESTIONS, ...GAD2_QUESTIONS, ...questionList1]
            : [...PHQ9_QUESTIONS, ...GAD7_QUESTIONS, ...questionList2];

        for (let questionObj of requiredQuestions) {
            if (!answers.hasOwnProperty(questionObj.question)) {
                return false;
            }
        }
        return true;
    };

    const areAllQuestionsAnswered = (currentAnswers) => {
        const requiredQuestions = currentQuestionSet === 'PHQ2_GAD2_QuestionList1'
            ? [...PHQ2_QUESTIONS, ...GAD2_QUESTIONS, ...questionList1]
            : [...PHQ9_QUESTIONS, ...GAD7_QUESTIONS, ...questionList2];
    
            const unanswered = requiredQuestions.filter(q => !currentAnswers.hasOwnProperty(q.question));

    
        if (unanswered.length > 0) {
            const missingList = unanswered.map((q, i) => `${i + 1}. ${q.question}`).join('\n');
            alert(`Please answer all questions before continuing.\nMissing:\n${missingList}`);
            return false;
        }
        return true;
    };
    
    const saveAnswersToFirestore = async () => {
        if (!validateAnswers()) {
            alert("Please answer all the questions before submitting.");
            return;
        }

        stopRecording();

        if (!auth.currentUser) {
            alert("User is not authenticated");
            return;
        }

        try {
            const userAnswers = Object.values(answers);
            let phq9Total = 0;
            let gad7Total = 0;
            let phq2Total = 0;
            let gad2Total = 0;

            let gad2Answers = {};
            let phq2Answers = {};
            let gad7Answers = {};
            let phq9Answers = {};

            console.log("in saveAnswersToFirestore isPHQ9Completed: ", isPHQ9Completed);
            console.log("in saveAnswersToFirestore currentQuestionSet: ", currentQuestionSet);

            if (currentQuestionSet === 'PHQ9_GAD7_QuestionList2') {
                for (let [question, answer] of Object.entries(answers)) {
                    console.log("in for loop of 111111 question: ", question);
                    const questionObject = PHQ9_QUESTIONS.find(q => q.question === question) 
                    || GAD7_QUESTIONS.find(q => q.question === question) || questionList2.find(q => q.question === question)  ;

                    if (questionObject.heading === 'PHQ-9') {
                        phq9Total += parseInt(answer);
                        phq9Answers[question] = parseInt(answer);
                    } else if (questionObject.heading === 'GAD-7') {
                        gad7Total += parseInt(answer);
                        gad7Answers[question] = parseInt(answer);
                    }
                    else 
                        ;
                }
            } else {
                for (let [question, answer] of Object.entries(answers)) {
                    const questionObject = PHQ2_QUESTIONS.find(q => q.question === question) || GAD2_QUESTIONS.find(q => q.question === question)
                    ||  questionList1.find(q => q.question === question) ;
                    if (questionObject.heading === 'PHQ-2') {
                        phq2Total += parseInt(answer);
                        phq2Answers[question] = parseInt(answer);
                    } else if (questionObject.heading === 'GAD-2') {
                        gad2Total += parseInt(answer);
                        gad2Answers[question] = parseInt(answer);
                    }
                    else ;
                }
            }
            
            await addDoc(collection(db, 'users', auth.currentUser.uid, 'answers'), {
                answers: userAnswers,
                phq9_total_score: phq9Total,
                gad7_total_score: gad7Total,
                phq2_total_score: phq2Total,
                gad2_total_score: gad2Total,
                timestamp: new Date()
            });

            if (Object.keys(gad7Answers).length > 0) {
                
                await addDoc(collection(db, 'users', auth.currentUser.uid, 'gad7'), {
                    answers: gad7Answers,
                    gad7_total_score: gad7Total,
                    timestamp: new Date()
                });
            }

            if (Object.keys(phq9Answers).length > 0) {
                await addDoc(collection(db, 'users', auth.currentUser.uid, 'phq9'), {
                    answers: phq9Answers,
                    phq9_total_score: phq9Total,
                    timestamp: new Date()
                });
                setIsPHQ9Completed(true);
            }

            if (Object.keys(gad2Answers).length > 0) {
                await addDoc(collection(db, 'users', auth.currentUser.uid, 'gad2'), {
                    answers: gad2Answers,
                    gad2_total_score: gad2Total,
                    timestamp: new Date()
                });
            }

            if (Object.keys(phq2Answers).length > 0) {
                await addDoc(collection(db, 'users', auth.currentUser.uid, 'phq2'), {
                    answers: phq2Answers,
                    phq2_total_score: phq2Total,
                    timestamp: new Date()
                });
            }

            if (isPHQ9Completed) {
                await setDoc(doc(db, 'users', auth.currentUser.uid, 'completedSets', 'PHQ9'), {
                    completed: true,
                    timestamp: new Date()
                });
            }

    //        alert("Answers saved successfully");
            navigate('/results');
        } catch (error) {
            alert("Failed to save answers. Please try again.");
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                navigate('/');
            } else {
                const phq9DocRef = collection(db, 'users', auth.currentUser.uid, 'phq9');
                const phq9Query = query(phq9DocRef, orderBy('timestamp', 'desc'));
                const phq9Snapshot = await getDocs(phq9Query);

                if (!phq9Snapshot.empty) {
                    const lastPHQ9 = phq9Snapshot.docs[0].data();
                    const phq9Questions = PHQ9_QUESTIONS.map(q => q.question);
                    const answeredQuestions = Object.keys(lastPHQ9.answers);
                    const hasCompletedPHQ9 = phq9Questions.every(q => answeredQuestions.includes(q));
                    setIsPHQ9Completed(hasCompletedPHQ9);
                    if (hasCompletedPHQ9) {
                        setCurrentQuestionSet('PHQ2_GAD2_QuestionList1');
                    } else {
                        setCurrentQuestionSet('PHQ9_GAD7_QuestionList2');
                    }
                } else {
                    setCurrentQuestionSet('PHQ9_GAD7_QuestionList2');
                }
            }
        });

        return () => {
            unsubscribe();
            disableMedia();
        };
    }, [navigate, disableMedia]);

    const renderQuestions = (questions) => {
        return questions.map((item, index) => (
            <div key={index} className="question-container">
                <p>{item.question}</p>
                {item.answerType === 'radio' ? (
                    ANSWER_OPTIONS.map(option => (
                        <label key={option.value}>
                            <input
                                type="radio"
                                name={`${item.question}-${index}`}
                                value={option.value}
                                checked={answers[item.question] === option.value}
                                onChange={() => handleAnswerChange(item.question, option.value)}
                            />
                            {option.label}
                        </label>
                    ))
                ) : item.answerType === 'yesNo' ? (
                    YES_NO_OPTIONS.map(option => (
                        <label key={option.value}>
                            <input
                                type="radio"
                                name={`${item.question}-${index}`}
                                value={option.value}
                                checked={answers[item.question] === option.value}
                                onChange={() => handleAnswerChange(item.question, option.value)}
                            />
                            {option.label}
                        </label>
                    ))
                ) :  (
                    <div>
                            <input
                            type="text"
                            value={answers[item.question] || ''}
                            onChange={(e) => handleAnswerChange(item.question, e.target.value)}
                            // assign the ref here:
                            ref={el => {
                                if (el) inputRefs.current[item.question] = el;
                            }}
                            />
                            <button
                            onClick={() => handleVoiceButtonClick(item.question)}
                            disabled={isVoiceActive}
                            >
                            음성 입력 시작
                            </button>
                        </div>
                )}


            </div>
                  
        ));
     
    };

    const addLog = (message) => {
        setRecordingLog(prevLog => [...prevLog, message]);
    };

    const handleRecordingCompleted = () => {
            
        if (!areAllQuestionsAnswered(answers)) return;
        
        if (mediaRecorderRef.current) {
            try {
                mediaRecorderRef.current.stop();
            } catch (error) {
                console.warn("Error stopping video recorder:", error);
            }
        } else {
            console.warn("mediaRecorderRef is null; no video recorder to stop.");
        }
    
        if (audioMediaRecorderRef.current) {
            try {
                audioMediaRecorderRef.current.stop();
            } catch (error) {
                console.warn("Error stopping audio recorder:", error);
            }
        } else {
            console.warn("audioMediaRecorderRef is null; no audio recorder to stop.");
        }
    
        setIsRecordingCompleted(true);
        setIsWaitingForResults(true);  // Set waiting for results to true
    
        disableMedia();
    };
    const hasSafetyRedFlag = () => {
        const redFlagQuestions = questionList2.filter(q => q.answerType === 'yesNo');
        return redFlagQuestions.some(q => (answers[q.question] || '').toLowerCase() === 'yes');

      };
      
// Replace handleRecordingCompleted + stopAudioRecording in onClick
const handleSubmit = async () => {
    if (!validateAnswers()) {
            alert("Please answer all the questions before submitting.");
            return;
        }
  // 1) First, stop camera/video & audio recorders (if they exist)
  if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
    try {
      mediaRecorderRef.current.stop();
    } catch (err) {
      console.warn("Error stopping video recorder:", err);
    }
  }
  if (audioMediaRecorderRef.current && audioMediaRecorderRef.current.state !== "inactive") {
    try {
      audioMediaRecorderRef.current.stop();
    } catch (err) {
      console.warn("Error stopping audio recorder:", err);
    }
  }

  // 2) Build the two blobs (video + audio):
  const videoBlob =
    recordedChunksRef.current.length > 0
      ? new Blob(recordedChunksRef.current, { type: "video/webm" })
      : null;

  const audioBlob =
    recordedAudioChunksRef.current.length > 0
      ? new Blob(recordedAudioChunksRef.current, { type: "audio/webm" })
      : null;

  setIsRecordingCompleted(true);
  setIsWaitingForResults(true);

     const API_URL = 'https://api.joiapp.org'; // or "http://localhost:8080" in dev
  // const API_URL = 'http://localhost:8080';




  // 3) Fire-and-forget: POST to both endpoints
  if (videoBlob && userId) {
    const vidForm = new FormData();
    vidForm.append("video", videoBlob, "recordedVideo.webm");
    vidForm.append("userId", userId);

      fetch(`${API_URL}/coupang/analyzeVideo`, {
      method: "POST",
      body: vidForm,
    })
      .then((res) => {
        if (!res.ok) {
          res.text().then((txt) =>
            addLog(`Video‐upload failed: ${res.status} ${res.statusText} – ${txt}`)
          );
        } else {
          addLog("✅ Video analysis request sent.");
        }
      })
      .catch((err) => {
        console.error("Error uploading video:", err);
        addLog(`❌ Video‐upload error: ${err.message}`);
      });
  }

  if (audioBlob && userId) {
    const audForm = new FormData();
    audForm.append("audio", audioBlob, "recordedAudio.webm");
    audForm.append("userId", userId);
  fetch(`${API_URL}/coupang/analyzeVoice`, {
      method: "POST",
      body: audForm,
    })
      .then((res) => {
        if (!res.ok) {
          res.text().then((txt) =>
            addLog(`Audio‐upload failed: ${res.status} ${res.statusText} – ${txt}`)
          );
        } else {
          addLog("✅ Voice analysis request sent.");
        }
      })
      .catch((err) => {
        console.error("Error uploading audio:", err);
        addLog(`❌ Audio‐upload error: ${err.message}`);
      })
      .finally(() => {
        setIsWaitingForVoiceResults(false);
      });
  }
saveAnswersToFirestore()
  // 4) Immediately navigate to /results (or keep spinner—your choice)
  navigate("/results");
};

    const proceedWithCameraConsent = async () => {
    try {
        mediaStream.current = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
        videoRef.current.srcObject = mediaStream.current;
        videoRef.current.play();
        setIsCameraEnabled(true);
        startRecording();
        addLog("카메라 활성화");

        if (userId) {
            await addDoc(collection(db, "users", userId, "consents"), {
            type: "camera",
            granted: true,
            timestamp: new Date()
            });
        }
        }
    } catch (error) {
        console.error("카메라 허용 실패:", error);
        alert("카메라 접근이 거부되었습니다.");
    }
    };

    const proceedWithMicrophoneConsent = async () => {
    try {
        mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        startRecording();
        addLog("마이크 활성화");

        if (userId) {
        await addDoc(collection(db, "users", userId, "consents"), {
            type: "microphone",
            granted: true,
            timestamp: new Date()
        });
        }
    } catch (error) {
        console.error("마이크 허용 실패:", error);
        alert("마이크 접근이 거부되었습니다.");
    }
    };

    return (
        <div className="questions-page">
        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
            className="logo-container"
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
            <img src={JoiAppLogo} alt="JoiApp Logo" style={{ height: '40px', marginRight: '12px' }} />
            <span className="app-name" style={{ fontSize: '20px', fontWeight: 'bold' }}>JoiApp</span>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link to="/settings" style={{ fontSize: '16px', textDecoration: 'none', color: '#333' }}>
            설정
            </Link>
            <button onClick={logout} className="logout-button">로그아웃</button>
        </div>
        </div>



            <div className="form-container">
                
            <p style={{ fontSize: '24px' }}>다음에 답하시요</p>

                
                <div className="button-group">
         
                <button onClick={() => { setConsentType('camera'); setShowConsentModal(true); }}>
                카메라 허용 요청
                </button>
                <button onClick={() => { setConsentType('microphone'); setShowConsentModal(true); }}>
                마이크 허용 요청
                </button>

    {/*            <button onClick={startRecording}>녹화시작</button>
                    <button onClick={stopRecording}>녹화중지</button>
        */}
 
                </div>
    
                <div className="video-container">
                    <video ref={videoRef} style={{ width: '100%', maxHeight: '400px', border: '2px solid #ccc' }} autoPlay playsInline></video>
                </div>
    
                <div className="log-container">
                    <h2>Activity Log</h2>
                    <ul>
                        {recordingLog.map((log, index) => (
                            <li key={index}>{log}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="form-container">
            <p style={{ fontSize: '20px' }}></p>
                {currentQuestionSet === 'PHQ2_GAD2_QuestionList1' ? (
                    <>
                    
                        {renderQuestions(PHQ2_QUESTIONS.map(q => ({ question: q.question, answerType: 'radio' })))}
    
                   
                        {renderQuestions(GAD2_QUESTIONS.map(q => ({ question: q.question, answerType: 'radio' })))}
    
                      
                        {renderQuestions(questionList1.map(q => q.answerType === 'yesNo' ? { question: q.question, answerType: 'yesNo' } : { question: q.question, answerType: 'text' }))}
                    </>
                ) : currentQuestionSet === 'PHQ9_GAD7_QuestionList2' && (
                    <>
                        
                        {renderQuestions(PHQ9_QUESTIONS.map(q => ({ question: q.question, answerType: 'radio', heading: 'PHQ-9' })))}
    
                       
                        {renderQuestions(GAD7_QUESTIONS.map(q => ({ question: q.question, answerType: 'radio', heading: 'GAD-7' })))}
    
                        
                        {renderQuestions(questionList2.map(q => q.answerType === 'yesNo' ? { question: q.question, answerType: 'yesNo' } : { question: q.question, answerType: 'text' }))}
                    </>
                )}

         {/* 
                       < button onClick={stopAudioRecording}>Stop Recording</button>
         */}   
    

    <div className="submit-container">
        <button
        onClick={handleSubmit}
        className="submit-button"
        disabled={isRecordingCompleted}
        >
        제출
        </button>


       

     
            </div> 

    
            </div>
                    {showConsentModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                        <h3>카메라 및 마이크 접근 허용</h3>
                        <p>서비스 이용을 위해 {consentType === 'camera' ? '카메라' : '마이크'} 접근이 필요합니다.<br />동의하시겠습니까?</p>
                        <div className="modal-buttons">
                            <button
                            onClick={async () => {
                                setShowConsentModal(false);
                                if (consentType === 'camera') {
                                await proceedWithCameraConsent();
                                } else if (consentType === 'microphone') {
                                await proceedWithMicrophoneConsent();
                                }
                            }}
                            >
                            예, 허용합니다
                            </button>
                            <button onClick={() => setShowConsentModal(false)}>아니오</button>
                        </div>
                        </div>
                    </div>
                    )}

        </div>
    
    
    );
};

export default QuestionsPage;
