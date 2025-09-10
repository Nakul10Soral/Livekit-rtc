import {
    FilesetResolver,
    ImageSegmenter,
    type ImageSegmenterResult,
} from "@mediapipe/tasks-vision";
import { useCallback, useEffect, useRef, useState } from "react";

type BackgroundType =
    | { type: "color"; color: [number, number, number] }
    | { type: "blur"; blurAmount?: number }
    | { type: "image"; image: HTMLImageElement | null };

interface UseVirtualBackgroundProps {
    videoRef?: React.RefObject<HTMLVideoElement | null>;
    canvasRef?: React.RefObject<HTMLCanvasElement | null>;
    background?: BackgroundType;
}

const useVirtualBackground = ({
    videoRef,
    canvasRef,
    background = { type: "color", color: [200, 200, 200] },
}: UseVirtualBackgroundProps) => {
    const [isEnabled, setIsEnabled] = useState(false);
    const segmenterRef = useRef<ImageSegmenter | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef<number>(-1);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    const initSegmenter = useCallback(async () => {
        if (segmenterRef.current) return;

        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        const segmenter = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite",
                delegate: 'GPU'
            },
            runningMode: "VIDEO",
            outputCategoryMask: true,
        });

        console.log("started")
        segmenterRef.current = segmenter;
    }, []);

    const handleSegmentation = useCallback(
        (result: ImageSegmenterResult) => {
            if (!canvasRef || !canvasRef.current || !videoRef || !videoRef.current || !ctxRef.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = ctxRef.current;

            const width = video.videoWidth;
            const height = video.videoHeight;
            if (width === 0 || height === 0) return;

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(video, 0, 0, width, height);
            const frame = ctx.getImageData(0, 0, width, height);
            const frameData = frame.data;

            if (!result.categoryMask) return;
            const mask = result.categoryMask.getAsUint8Array();

            const output = ctx.createImageData(width, height);
            const outputData = output.data;

            for (let i = 0; i < mask.length; i++) {
                const isPerson = mask[i] === 0;
                const p = i * 4;

                if (!isPerson) {
                    outputData[p] = frameData[p];
                    outputData[p + 1] = frameData[p + 1];
                    outputData[p + 2] = frameData[p + 2];
                    outputData[p + 3] = 255;
                } else {
                    if (background.type === "color") {
                        const [r, g, b] = background.color;
                        outputData[p] = r;
                        outputData[p + 1] = g;
                        outputData[p + 2] = b;
                        outputData[p + 3] = 255;
                    } else if (background.type === "image" && background.image) {
                        const x = i % width;
                        const y = Math.floor(i / width);
                        ctx.drawImage(background.image, 0, 0, width, height);
                        const bgPixel = ctx.getImageData(x, y, 1, 1).data;
                        outputData[p] = bgPixel[0];
                        outputData[p + 1] = bgPixel[1];
                        outputData[p + 2] = bgPixel[2];
                        outputData[p + 3] = 255;
                    } else if (background.type === "blur") {
                        outputData[p] = 200;
                        outputData[p + 1] = 200;
                        outputData[p + 2] = 200;
                        outputData[p + 3] = 255;
                    }
                }
            }

            ctx.putImageData(output, 0, 0);

            if (background.type === "blur") {
                canvas.style.filter = `blur(${background.blurAmount || 8}px)`;
            } else {
                canvas.style.filter = "none";
            }
        },
        [canvasRef, videoRef, background]
    );

    const processFrame = useCallback(() => {
        if (
            !segmenterRef.current ||
            !videoRef ||
            !videoRef.current ||
            videoRef.current.paused ||
            videoRef.current.videoWidth === 0
        ) {
            rafRef.current = requestAnimationFrame(processFrame);
            return;
        }

        const video = videoRef.current;
        const now = performance.now();

        if (video.currentTime !== lastFrameTimeRef.current) {
            lastFrameTimeRef.current = video.currentTime;

            segmenterRef.current.segmentForVideo(video, now, handleSegmentation);
        }

        rafRef.current = requestAnimationFrame(processFrame);
    }, [handleSegmentation, videoRef]);

    useEffect(() => {
        if (canvasRef && canvasRef.current && !ctxRef.current) {
            ctxRef.current = canvasRef.current.getContext("2d");
        }
    }, [canvasRef]);

    useEffect(() => {
        if (isEnabled) {
            initSegmenter();
        }
    }, [isEnabled, initSegmenter]);

    useEffect(() => {
        if (isEnabled && segmenterRef.current) {
            rafRef.current = requestAnimationFrame(processFrame);
        }
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isEnabled, processFrame]);

    const getProcessedStream = useCallback(() => {
        if (canvasRef) {
            return canvasRef.current?.captureStream() || null;
        }
    }, [canvasRef]);

    return {
        isEnabled,
        setIsEnabled,
        getProcessedStream,
    };
};

export default useVirtualBackground;
