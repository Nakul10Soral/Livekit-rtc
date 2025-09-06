import { FilesetResolver, GestureRecognizer, type GestureRecognizerResult } from "@mediapipe/tasks-vision"
import { useCallback, useEffect, useRef, useState } from "react"


const useGesture = ({ userType, localStreamRef }: {
    userType: 'local' | 'remote',
    localStreamRef?: React.RefObject<HTMLVideoElement | null>,
}) => {
    const [isGestureEnabled, setisGestureEnabled] = useState(false)
    const [isGestureRecognizer, setGestureRecognizer] = useState<GestureRecognizerResult | null>(null)

    const gestureRecognizerRef = useRef<GestureRecognizer | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const lastVideotimeRef = useRef<number>(-1)

    const initGestureRecognizer = useCallback(async () => {
        if (userType === 'local' && !gestureRecognizerRef.current) {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );
                const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task",
                        delegate: 'CPU',
                    },
                    numHands: 2,
                    runningMode: 'VIDEO'
                });
                gestureRecognizerRef.current = gestureRecognizer;
            } catch (error) {
                console.error('Failed to initialize gesture recognizer:', error)
            }
        }
    }, [userType])

    const recognizeGesture = useCallback(() => {
        if (
            gestureRecognizerRef.current &&
            localStreamRef?.current &&
            !localStreamRef.current.paused &&
            localStreamRef.current.videoWidth > 0 &&
            localStreamRef.current.videoHeight > 0
        ) {
            try {
                const currentTime = performance.now();
                if (localStreamRef.current.currentTime !== lastVideotimeRef.current) {
                    lastVideotimeRef.current = localStreamRef.current.currentTime;
                    const result = gestureRecognizerRef.current.recognizeForVideo(
                        localStreamRef.current,
                        currentTime
                    );
                    setGestureRecognizer(result);
                }
            } catch (error) {
                console.error('Gesture recognition error:', error);
            }
        }

        animationFrameRef.current = requestAnimationFrame(recognizeGesture);
    }, [localStreamRef]);

    useEffect(() => {
        if (isGestureEnabled) {
            initGestureRecognizer()
        }
    }, [initGestureRecognizer, isGestureEnabled])

    useEffect(() => {
        if (!isGestureEnabled || userType !== 'local') return;

        const video = localStreamRef?.current;
        if (!video) return;

        let active = true;

        const startRecognize = () => {
            if (!active) return;
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            recognizeGesture();
        };

        const stopRecognize = () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };

        if (video.readyState >= 2) {
            startRecognize();
        } else {
            video.addEventListener("loadeddata", startRecognize);
        }

        video.addEventListener("pause", stopRecognize);
        video.addEventListener("ended", stopRecognize);

        return () => {
            active = false;
            stopRecognize();
            video.removeEventListener("loadeddata", startRecognize);
            video.removeEventListener("pause", stopRecognize);
            video.removeEventListener("ended", stopRecognize);
        };
    }, [isGestureEnabled, recognizeGesture, userType, localStreamRef]);

    useEffect(() => {
        const currentAnimationFrame = animationFrameRef.current;
        return () => {
            if (currentAnimationFrame) {
                cancelAnimationFrame(currentAnimationFrame)
            }
        }
    }, [])
    return {
        setisGestureEnabled,
        isGestureEnabled,
        isGestureRecognizer
    }
}

export default useGesture