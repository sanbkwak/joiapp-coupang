import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogout } from './utils/logout.js';
import { auth, db } from './firebaseConfig';
import { collection, addDoc, query, doc,  getDocs, orderBy, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './css/QuestionsPage.css';
import { GAD7_QUESTIONS, PHQ9_QUESTIONS, GAD2_QUESTIONS, PHQ2_QUESTIONS, ANSWER_OPTIONS, questionList1, questionList2, YES_NO_OPTIONS } from './utils/questions.js';
//import { getPublicKey } from '@stellar/freighter-api';
import JoiAppLogo from './joiapplogo.png'; 

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

    const handleMediaPermissions = async () => {
        try {
            mediaStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream.current;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    console.log("Camera and microphone are now enabled and video is playing.");
                };
                setIsCameraEnabled(true);
     
                startRecording(); // If applicable
                addLog("Camera and microphone enabled.");
            } else {
                console.error("Video reference is not defined.");
            }
        } catch (error) {
            console.error("Unable to access camera and microphone:", error);
            alert("Unable to access camera and microphone. Please check permissions.");
        }
    };
    const handleAudioMediaPermissions = async () => {
        try {
            // Request access to the microphone only
            mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    
            if (mediaStream.current) {
                console.log("Microphone is now enabled.");
    
                // Optionally, start recording if needed
                startRecording(); // If applicable
    
                // Update log and state accordingly
                addLog("Microphone enabled.");
            } else {
                console.error("Media stream could not be created.");
            }
        } catch (error) {
            console.error("Unable to access the microphone:", error);
            alert("Unable to access the microphone. Please check permissions.");
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
 //       stopAllMedia();
       // mediaStream.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
         audioStream.current = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        // show it to user
  //      audio.src = window.URL.createObjectURL(audioStream);
  //      this.audio.play();

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
        formData.append('userId', userId);
        try {
            setIsWaitingForVoiceResults(true); // Show waiting indicator
   //         const API_URL = "http://localhost:8080";
          const API_URL = "https://api.joiapp.org";
            const response = await fetch(`${API_URL}/analyzeVoice`, {


   //        const response = await fetch('https://api.joiapp.org/analyzeVoice', {
    // const response = await fetch('https://joiappbackend-56278236485.us-central1.run.app/analyzeVoice', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' },
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
            const API_URL = "https://api.joiapp.org";
            const response = await fetch(`${API_URL}/analyzeVideo`, {
          //  const response = await fetch('https://api.joiapp.org/analyze', {
        //        const response = await fetch('https://joiappbackend-56278236485.us-central1.run.app/analyze', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' },
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
        // Ensure media permissions are granted before starting recording
        if (!mediaStream.current) {
            await handleAudioMediaPermissions();
        }
    
        if (mediaStream.current) {
            // Start audio recording if it's not already recording
            if (!isRecording) {
                startAudioRecording();
                setIsRecording(true);
            }
    
            // Start voice recognition for the specific question
            startVoiceRecognition(question);
        } else {
            alert("Unable to access microphone. Please check your permissions.");
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
                        />
                        <button
                            onClick={() => handleVoiceButtonClick(item.question)}
                            disabled={isVoiceActive}
                        >
                            음성으로 답변하기
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
        <div className="questions-page">
            <div className="header">
                    <div className="logo-container" onClick={() => navigate('/dashboard')}>
                <img src={JoiAppLogo} alt="JoiApp Logo" className="logo" />
                <span className="app-name">JoiApp</span>
           </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {userId && <p>User ID: {userId}</p>}
                    </div>
                <button onClick={logout} className="logout-button">
                    로그아웃
                </button>
            </div>


            <div className="container">
                
            <p style={{ fontSize: '24px' }}>설문지</p>

                
                <div className="button-group">
         
                    <button onClick={handleMediaPermissions}>카메라와 마이크 활성화</button>
                    <button onClick={disableMedia}>카메라와 마이크 불활성화</button>
                    <button onClick={startRecording}>녹화시작</button>
                    <button onClick={stopRecording}>녹화중지</button>

                </div>
    
                <div className="video-container">
                    <video ref={videoRef} style={{ width: '100%', maxHeight: '400px', border: '2px solid #ccc' }} autoPlay playsInline></video>
                </div>
    
                <div className="log-container">
                    <h2>녹화기록</h2>
                    <ul>
                        {recordingLog.map((log, index) => (
                            <li key={index}>{log}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="form-container">
            <p style={{ fontSize: '20px' }}>다음의 질문에 답을 해주세요.</p>
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

<button onClick={stopAudioRecording}>녹음중지</button>
    

<div className="submit-container">
    <button
        onClick={() => {
            handleRecordingCompleted();
            stopAudioRecording();
            setIsWaitingForResults(true); // Show waiting text when recording is completed
        }}
        className="submit-button"
        disabled={isRecordingCompleted} // Disable after recording is completed
    >
        완료
    </button>

    {isWaitingForResults && <p className="waiting-text">결과대기중..</p>}
    <button
        onClick={saveAnswersToFirestore}
        className={`submit-button2 ${!isWaitingForResults && isRecordingCompleted && !isWaitingForVoiceResults ? 'blinking' : ''}`}
        disabled={!isRecordingCompleted || isWaitingForResults} // Disable until recording is completed and not waiting for results
    >
        결과전송
    </button>
</div>


                {results && results_voice && (
    <div className="results-log">
        <h2>결과</h2>
        <div>
        <h3>  Voice 분석결과</h3>
            <ul>
                {Array.isArray(results_voice.results) && results_voice.results.length > 0 ? (
                    results_voice.results.map((analysis, index) => (
                        <li key={index}>
                            <pre>{JSON.stringify(analysis, null, 2)}</pre>
                        </li>
                    ))
                ) :  isWaitingForVoiceResults ? (
                    <li>
                      <svg
                        className="spinner"
                        width="44px"
                        height="44px"
                        viewBox="0 0 44 44"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g fill="none" fillRule="evenodd" strokeWidth="2">
                          <circle cx="22" cy="22" r="1">
                            <animate
                              attributeName="r"
                              begin="0s"
                              dur="1.8s"
                              values="1; 20"
                              calcMode="spline"
                              keyTimes="0; 1"
                              keySplines="0.165, 0.84, 0.44, 1"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="stroke-opacity"
                              begin="0s"
                              dur="1.8s"
                              values="1; 0"
                              calcMode="spline"
                              keyTimes="0; 1"
                              keySplines="0.3, 0.61, 0.355, 1"
                              repeatCount="indefinite"
                            />
                          </circle>
                          <circle cx="22" cy="22" r="1">
                            <animate
                              attributeName="r"
                              begin="-0.9s"
                              dur="1.8s"
                              values="1; 20"
                              calcMode="spline"
                              keyTimes="0; 1"
                              keySplines="0.165, 0.84, 0.44, 1"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="stroke-opacity"
                              begin="-0.9s"
                              dur="1.8s"
                              values="1; 0"
                              calcMode="spline"
                              keyTimes="0; 1"
                              keySplines="0.3, 0.61, 0.355, 1"
                              repeatCount="indefinite"
                            />
                          </circle>
                        </g>
                      </svg>
                      <div>분석 중입니다. 잠시만 기다려주세요...</div>
                    </li>
                  ) : (
                    <li>분석결과미정</li>
                  )}
                </ul>

            <h3>분석결과</h3>
            <ul>
                {Array.isArray(results.results) && results.results.length > 0 ? (
                    results.results.map((analysis, index) => (
                        <li key={index}>
                            <pre>{JSON.stringify(analysis, null, 2)}</pre>
                        </li>
                    ))
                ) : (
                    <li>분석 중입니다. 잠시만 기다려주세요...</li>
                )}
        </ul>

        </div>
    </div>
)}



            </div>
        </div>
    );
};

export default QuestionsPage;
