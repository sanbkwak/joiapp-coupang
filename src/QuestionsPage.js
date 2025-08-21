import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from './utils/logout.js';
import { auth, db } from './firebaseConfig';
import { collection, addDoc, query, doc,  getDocs, getDoc, orderBy, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './css/QuestionsPage.css';
import { GAD7_QUESTIONS, PHQ9_QUESTIONS, GAD2_QUESTIONS, PHQ2_QUESTIONS, ANSWER_OPTIONS, questionList1, questionList2, YES_NO_OPTIONS } from './utils/questions.js';
//import { getPublicKey } from '@stellar/freighter-api';
import JoiAppLogo from './joiapplogo.png'; 
import AppLayout, { AppSection, AppButton, AppFormGroup, AppInput, AppStatusMessage } from './components/layout/AppLayout';
import { Link } from 'react-router-dom';
import { getAuth } from "firebase/auth";
import { getAuthToken } from './utils/authUtility';

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
const [consentType, setConsentType] = useState(null);
    const [consentState, setConsentState] = useState({
        camera: true,
        microphone: true,
        voiceRecording: true,
        emotionAI: false,
        surveySubmission: true,
    });
 const inputRefs = useRef({});
    const auth = getAuth();
    const user = auth.currentUser;
    const [userId, setUserId] = useState(null);

    const recognition = useMemo(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRecognition();
        rec.lang = 'ko-KR'; // Set language to Korean for the questions
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        return rec;
    }, []);
    recognition.lang = 'ko-KR'; // Set language to Korean for the questions
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

      // const API_URL = "http://localhost:8080";
      const API_URL = "http://api.joiapp.org";

    const disableMedia = useCallback(() => {
        if (mediaStream.current) {
            mediaStream.current.getTracks().forEach(track => track.stop());
            mediaStream.current = null;
            setIsCameraEnabled(false);
 
            console.log("Media stream disabled.");
        }
    }, []);

useEffect(() => {
    const token = getAuthToken();
    if (!token) {
        navigate('/login');
        return;
    }
    
    // Continue with existing auth check...
}, [navigate]);

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
    if (!consentState.camera) {
        alert("카메라 사용에 동의하지 않으셨습니다. 설정에서 허용해주세요.");
        return;
    }
    
    try {
        // Stop any existing video stream
        if (mediaStream.current) {
            mediaStream.current.getTracks().forEach(track => track.stop());
        }
        
        // Request only video for camera recording
        mediaStream.current = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false  // Keep audio separate
        });
        
        if (videoRef.current) {
            videoRef.current.srcObject = mediaStream.current;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current.play();
                console.log("카메라 활성화됨");
            };
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
        console.error("카메라 활성화 실패:", error);
        alert("카메라를 활성화해주세요. 브라우저 설정에서 카메라 권한을 확인해주세요.");
    }
};


const handleAudioMediaPermissions = async () => {
    if (!consentState.microphone) {
        alert("마이크 사용에 동의하지 않으셨습니다. 설정에서 허용해주세요.");
        return;
    }
    
    try {
        // Stop any existing audio stream first
        if (audioStream.current) {
            audioStream.current.getTracks().forEach(track => track.stop());
        }
        
        // Request fresh microphone access
        audioStream.current = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: false 
        });
        
        if (audioStream.current) {
            console.log("Microphone is now enabled.");
            addLog("Microphone enabled.");
            
            // Log consent to Firestore
            if (userId) {
                await addDoc(collection(db, "users", userId, "consents"), {
                    type: "microphone",
                    granted: true,
                    timestamp: new Date()
                });
            }
        }
    } catch (error) {
        console.error("마이크 활성화 실패:", error);
        alert("마이크를 활성화해주세요. 브라우저 설정에서 마이크 권한을 확인해주세요.");
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
    console.log("in startAudioRecording");
    
    // Make sure we have audio stream
    if (!audioStream.current) {
        await handleAudioMediaPermissions();
    }
    
    if (!audioStream.current) {
        console.error("No audio stream available");
        return;
    }

    try {
        console.log("Starting audio recording with stream");
        
        // Find supported MIME type
        const supportedMimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4'];
        let mimeType = '';

        for (let type of supportedMimeTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                mimeType = type;
                break;
            }
        }

        if (!mimeType) {
            console.error("No supported MIME type found for MediaRecorder");
            return;
        }

        console.log(`Using MIME type: ${mimeType}`);
        
        const audioMediaRecorder = new MediaRecorder(audioStream.current, { mimeType });
        audioMediaRecorderRef.current = audioMediaRecorder;

        audioMediaRecorder.onerror = (event) => {
            console.error("MediaRecorder error:", event.error);
        };

        audioMediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedAudioChunksRef.current.push(event.data);
            }
        };

        audioMediaRecorder.onstop = async () => {
            console.log('Audio recording stopped.');
            const audioBlob = new Blob(recordedAudioChunksRef.current, { type: mimeType });
            recordedAudioChunksRef.current = [];
            await handleAudioUpload(audioBlob);
        };

        audioMediaRecorder.start();
        console.log("Audio recording started successfully.");
        setIsRecording(true);

    } catch (error) {
        console.error("Error starting MediaRecorder:", error);
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
            alert("음성을 인식하지 못했습니다. 다시 시도해 주세요.");
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
    
        try {
            setIsWaitingForVoiceResults(true); // Show waiting indicator


            const response = await fetch(`${API_URL}/api/v1/coupang/analyzeVoice`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                    'Accept': 'application/json'
                },
                body: formData
            });

            if (response.ok) {
                const responseData = await response.json(); // Parse the response as JSON
                console.log("Audio analysis response:", responseData);
    
                if (responseData && responseData.emotions) {
                    // Set the state with the response data
                    setVoiceResults({
                        dominant_emotions: [Object.keys(responseData.emotions).reduce((a, b) => 
                            responseData.emotions[a] > responseData.emotions[b] ? a : b)],
                        results: Object.entries(responseData.emotions).map(([emotion, value]) => ({ emotion, value }))
                    });
    
                    console.log("Dominant Voice Emotions:", responseData.emotions);
                    addLog("Voice data uploaded successfully. Dominant emotions: " + 
                            Object.keys(responseData.emotions).reduce((a, b) => 
                                responseData.emotions[a] > responseData.emotions[b] ? a : b));
                } else {
                    console.error("Unexpected response structure. Expected object with 'emotions' property.");
                }
            } else {
                console.error("Audio upload failed:", await response.text());
            }  
        } catch (error) {
            console.error("Error uploading audio:", error.message);
        } finally {
            setIsWaitingForVoiceResults(false); // Hide waiting indicator
        }
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
        if (!videoRef.current || !videoRef.current.srcObject) {
          alert("Please enable camera and microphone first.");
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
        addLog('Recording stopped.');
        setIsRecordingCompleted(true);

        if (!userId) {
            addLog('User is not authenticated. Cannot upload video.');
            return;
        }

//                const userId = auth.currentUser.uid;
  //    const userId = userPublicKey;
        addLog(`questionsPage: auth.currentUser.uid: ${userId}`);

        const formData = new FormData();
        formData.append('video', videoBlob, 'recordedVideo.webm');
        formData.append('userId', userId);
        try {
            setIsWaitingForResults(true); // Show waiting indicator
      //      const API_URL = "http://localhost:8080";
        
  const response = await fetch(`${API_URL}/api/v1/coupang/analyzeVideo`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Accept': 'application/json'
    },
    body: formData
});
        
            if (response.ok) {
                const responseText = await response.text();
                console.log("Response video text:", responseText);
        
                let result;
                try {
                    result = JSON.parse(responseText);
                } catch (error) {
                    console.error("Failed to parse JSON:", error);
                    return; // You could add more error handling logic here if needed.
                }
        
                console.log("Parsed result:", result);
        
                // Check if result is an object with expected properties
                if (result && result.dominant_facial_emotions && result.results) {
                    // Use the result properties directly
                    setResults(result);
                    console.log("Dominant Facial Emotions:", result.dominant_facial_emotions);
                    addLog("Video uploaded successfully. Dominant emotions: " + result.dominant_facial_emotions.join(", "));
                } else {
                    console.error("Unexpected response structure. Expected object with 'dominant_emotions' and 'results' properties.");
                }
        
            } else {
                addLog("Upload failed: " + await response.text());
            }
        } catch (error) {
            addLog("Error uploading video: " + error.message);
        } finally {
            setIsWaitingForResults(false); // Hide waiting indicator
        }
    }

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

  const handleVoiceButtonClick = async (question) => {
    // Ensure audio permissions are granted before starting recording
    if (!audioStream.current) {
        await handleAudioMediaPermissions();
        
        // Wait a moment for permissions to be processed
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (audioStream.current) {
        // Start audio recording if it's not already recording
        if (!isRecording) {
            await startAudioRecording();
        }

        // Start voice recognition for the specific question
        startVoiceRecognition(question);
    } else {
        alert("마이크에 접근할 수 없습니다. 브라우저 설정에서 마이크 권한을 확인해주세요.");
    }
};
    

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
        if (!isCameraEnabled) {
            alert("Please enable the camera and microphone first.");
            handleMediaPermissions(); // Prompt to enable camera
            startRecording();
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
        // Define the total number of questions that need to be answered
        const requiredQuestions = currentQuestionSet === 'PHQ2_GAD2_QuestionList1'
            ? [...PHQ2_QUESTIONS, ...GAD2_QUESTIONS, ...questionList1]
            : [...PHQ9_QUESTIONS, ...GAD7_QUESTIONS, ...questionList2];
    
        // Check if every required question has an answer
        return requiredQuestions.every((q) => currentAnswers.hasOwnProperty(q.question));
    };

 const handleSubmit = async () => {
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

           // alert("Answers saved successfully");
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

     // Custom Modal Component using AppLayout style
    const ConsentModal = () => {
        if (!showConsentModal) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    maxWidth: '400px',
                    margin: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '16px'
                    }}>
                        카메라 및 마이크 접근 허용
                    </h3>
                    <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '24px',
                        lineHeight: '1.5'
                    }}>
                        서비스 이용을 위해 {consentType === 'camera' ? '카메라' : '마이크'} 접근이 필요합니다.<br />
                        동의하시겠습니까?
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'flex-end'
                    }}>
                        <AppButton
                            variant="outline"
                            onClick={() => setShowConsentModal(false)}
                        >
                            아니오
                        </AppButton>
                        <AppButton
                            onClick={async () => {
                                setShowConsentModal(false);
                                if (consentType === 'camera') {
                                    await handleMediaPermissions();
                                } else if (consentType === 'microphone') {
                                    await handleAudioMediaPermissions();
                                }
                            }}
                        >
                            예, 허용합니다
                        </AppButton>
                    </div>
                </div>
            </div>
        );
    };

      const renderQuestions = (questions) => {
        return questions.map((item, index) => (
            <AppFormGroup key={index} label={item.question} style={{ marginBottom: '24px' }}>
                {item.answerType === 'radio' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ANSWER_OPTIONS.map(option => (
                            <label key={option.value} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '6px',
                                backgroundColor: answers[item.question] === option.value ? '#f0f9ff' : 'transparent',
                                border: `1px solid ${answers[item.question] === option.value ? '#2563eb' : '#e5e7eb'}`
                            }}>
                                <input
                                    type="radio"
                                    name={`${item.question}-${index}`}
                                    value={option.value}
                                    checked={answers[item.question] === option.value}
                                    onChange={() => handleAnswerChange(item.question, option.value)}
                                    style={{ margin: 0 }}
                                />
                                <span style={{
                                    fontSize: '14px',
                                    color: '#374151'
                                }}>
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </div>
                ) : item.answerType === 'yesNo' ? (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {YES_NO_OPTIONS.map(option => (
                            <label key={option.value} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                padding: '12px 16px',
                                borderRadius: '6px',
                                backgroundColor: answers[item.question] === option.value ? '#f0f9ff' : '#f9fafb',
                                border: `1px solid ${answers[item.question] === option.value ? '#2563eb' : '#e5e7eb'}`,
                                flex: 1,
                                justifyContent: 'center'
                            }}>
                                <input
                                    type="radio"
                                    name={`${item.question}-${index}`}
                                    value={option.value}
                                    checked={answers[item.question] === option.value}
                                    onChange={() => handleAnswerChange(item.question, option.value)}
                                    style={{ margin: 0 }}
                                />
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: '#374151'
                                }}>
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <AppInput
                            type="text"
                            value={answers[item.question] || ''}
                            onChange={(e) => handleAnswerChange(item.question, e.target.value)}
                            style={{ flex: 1 }}
                            ref={el => {
                                if (el) inputRefs.current[item.question] = el;
                            }}
                        />
                        <AppButton
                            onClick={() => handleVoiceButtonClick(item.question)}
                            disabled={isVoiceActive}
                            variant="outline"
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            음성 입력 시작
                        </AppButton>
                    </div>
                )}
            </AppFormGroup>
        ));
    };


    const addLog = (message) => {
        setRecordingLog(prevLog => [...prevLog, message]);
    };

    const handleRecordingCompleted = () => {
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
    

    return (
        <AppLayout maxWidth={800}>
            {/* Custom Header */}
            <AppSection style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div
                    onClick={() => navigate('/survey')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        gap: '12px'
                    }}
                >
                    <img
                        src={JoiAppLogo}
                        alt="JoiApp Logo"
                        style={{ height: '32px' }}
                    />
                    <span style={{
                        fontSize: '20px',
                        fontWeight: '700',
                        color: '#111827'
                    }}>
                        JoiApp
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Link
                        to="/settings"
                        style={{
                            fontSize: '14px',
                            textDecoration: 'none',
                            color: '#6b7280',
                            fontWeight: '500'
                        }}
                    >
                        설정
                    </Link>
                    <AppButton onClick={logout} variant="secondary">
                        로그아웃
                    </AppButton>
                </div>
            </AppSection>

            {/* Status Messages */}
            {isWaitingForResults && (
                <AppStatusMessage
                    message="비디오 분석 중..."
                    type="info"
                />
            )}
            {isWaitingForVoiceResults && (
                <AppStatusMessage
                    message="음성 분석 중..."
                    type="info"
                />
            )}

            {/* Main Content */}
            <AppSection style={{ padding: '24px' }}>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '24px',
                    textAlign: 'center'
                }}>
                    오늘 마음날씨는 어떤가요?
                </h1>

                {/* Media Controls */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '24px',
                    justifyContent: 'center'
                }}>
                    <AppButton
                        onClick={() => { setConsentType('camera'); setShowConsentModal(true); }}
                        variant="outline"
                    >
                        카메라 허용 요청
                    </AppButton>
                    <AppButton
                        onClick={() => { setConsentType('microphone'); setShowConsentModal(true); }}
                        variant="outline"
                    >
                        마이크 허용 요청
                    </AppButton>
                </div>

                {/* Video Container */}
                        <div style={{
                    marginBottom: '24px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid #e5e7eb',
                    minHeight: '300px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f9fafb'
                }}>
                    {isCameraEnabled ? (
                        <video
                            ref={videoRef}
                            style={{
                                width: '100%',
                                maxHeight: '400px',
                                display: 'block'
                            }}
                            autoPlay
                            playsInline
                        />
                    ) : (
                        <div style={{
                            padding: '40px 24px',
                            textAlign: 'center',
                            maxWidth: '500px'
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                backgroundColor: '#e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px auto'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                </svg>
                            </div>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#111827',
                                marginBottom: '12px'
                            }}>
                                카메라 권한이 필요합니다
                            </h3>
                            <p style={{
                                fontSize: '14px',
                                color: '#6b7280',
                                lineHeight: '1.6',
                                marginBottom: '0'
                            }}>
                                카메라 영상은 저장되지 않습니다. 실시간으로 분석된 필요한 정신건강 정보만이 암호화되어 서버로 안전하게 전송됩니다. 저희는 무엇보다 귀하의 개인정보 보호를 최우선으로 합니다.
                            </p>
                        </div>
                    )}
                </div>

                {/* Activity Log */}
                {recordingLog.length > 0 && (
                    <div style={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '24px'
                    }}>
                        <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '12px'
                        }}>
                            Activity Log
                        </h3>
                        <div style={{
                            maxHeight: '150px',
                            overflowY: 'auto'
                        }}>
                            {recordingLog.map((log, index) => (
                                <div key={index} style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    padding: '2px 0'
                                }}>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Questions */}
                <div style={{ marginBottom: '32px' }}>
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
                </div>

                {/* Submit Button */}
                <div style={{ textAlign: 'center' }}>
                    <AppButton
                        onClick={handleSubmit}
                        disabled={isRecordingCompleted}
                        fullWidth
                        style={{ maxWidth: '300px' }}
                    >
                        제출
                    </AppButton>
                </div>
            </AppSection>

            {/* Consent Modal */}
            <ConsentModal />
        </AppLayout>
    );
};

export default QuestionsPage;