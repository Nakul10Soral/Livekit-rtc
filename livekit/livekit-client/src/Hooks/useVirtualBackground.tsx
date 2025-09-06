import { FilesetResolver, ImageSegmenter, ImageSegmenterResult } from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";

const useVirtualBackground = ({
    userType,
    localStreamRef,
    canvasRef,
}: {
    userType: "local" | "remote";
    localStreamRef?: React.RefObject<HTMLVideoElement | null>;
    canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}) => {
    const [isVirtualEnabled, setIsVirtualEnabled] = useState(false);

    const vertualizerRef = useRef<ImageSegmenter | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastVideotimeRef = useRef<number>(-1);
    const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null);

    /** Step 1: Initialize ImageSegmenter */
    const initImageSegmenter = useCallback(async () => {
        if (userType === "local" && !vertualizerRef.current) {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );
                const imageSegmenter = await ImageSegmenter.createFromOptions(
                    vision,
                    {
                        baseOptions: {
                            modelAssetPath:
                                "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite",
                        },
                        outputCategoryMask: true,
                        outputConfidenceMasks: false,
                        runningMode: "VIDEO",
                    }
                );

                vertualizerRef.current = imageSegmenter;
            } catch (error) {
                console.error("Failed to initialize ImageSegmenter:", error);
            }
        }
    }, [userType]);

    /** Step 2: Callback for each video frame */
    const callbackForVideo = useCallback(
        (result: ImageSegmenterResult) => {
            if (!result || !canvasContextRef.current || !localStreamRef?.current)
                return;

            const canvas = canvasRef?.current;
            if (!canvas) return;

            const ctx = canvasContextRef.current;
            const width = localStreamRef.current.videoWidth;
            const height = localStreamRef.current.videoHeight;

            if (width === 0 || height === 0) return;

            // Resize canvas to match video
            canvas.width = width;
            canvas.height = height;

            // Draw current video frame
            ctx.drawImage(localStreamRef.current, 0, 0, width, height);
            const frame = ctx.getImageData(0, 0, width, height);
            const frameData = frame.data;

            // Get segmentation mask
            if (!result.categoryMask) return;
            const mask = result.categoryMask.getAsUint8Array();

            // Output frame
            const output = ctx.createImageData(width, height);
            const outputData = output.data;

            for (let i = 0; i < mask.length; i++) {
                const isPerson = mask[i] === 1; // 1 → person, 0 → background
                const pixelIndex = i * 4;

                if (isPerson) {
                    // Keep original pixel
                    outputData[pixelIndex] = frameData[pixelIndex];
                    outputData[pixelIndex + 1] = frameData[pixelIndex + 1];
                    outputData[pixelIndex + 2] = frameData[pixelIndex + 2];
                    outputData[pixelIndex + 3] = 255;
                } else {
                    // Replace background (solid gray color here)
                    outputData[pixelIndex] = 200;
                    outputData[pixelIndex + 1] = 200;
                    outputData[pixelIndex + 2] = 200;
                    outputData[pixelIndex + 3] = 255;
                }
            }

            // Draw final composited frame
            ctx.putImageData(output, 0, 0);
        },
        [canvasRef, localStreamRef]
    );

    const changeBackground = useCallback(() => {
        if (
            vertualizerRef.current &&
            localStreamRef?.current &&
            !localStreamRef.current.paused &&
            localStreamRef.current.videoWidth > 0 &&
            localStreamRef.current.videoHeight > 0 &&
            canvasRef?.current &&
            canvasContextRef.current
        ) {
            try {
                const currentTime = performance.now();
                if (localStreamRef.current.currentTime !== lastVideotimeRef.current) {
                    lastVideotimeRef.current = localStreamRef.current.currentTime;

                    vertualizerRef.current.segmentForVideo(
                        localStreamRef.current,
                        currentTime,
                        callbackForVideo
                    );
                }
            } catch (error) {
                console.error("Segmentation error:", error);
            }
        }
        animationFrameRef.current = requestAnimationFrame(changeBackground);
    }, [callbackForVideo, canvasRef, localStreamRef]);

    useEffect(() => {
        if (canvasRef?.current && !canvasContextRef.current) {
            canvasContextRef.current = canvasRef.current.getContext("2d");
        }
    }, [canvasRef]);

    useEffect(() => {
        if (isVirtualEnabled) {
            initImageSegmenter();
        }
    }, [initImageSegmenter, isVirtualEnabled]);

    useEffect(() => {
        if (isVirtualEnabled && vertualizerRef.current) {
            animationFrameRef.current = requestAnimationFrame(changeBackground);
        }
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isVirtualEnabled, changeBackground]);

    return {
        isVirtualEnabled,
        setIsVirtualEnabled,
    };
};

export default useVirtualBackground;
