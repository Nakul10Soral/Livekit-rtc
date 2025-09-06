import { Hand, Mic, MicOff, Video, VideoOff } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { RemoteParticipant, Room } from "livekit-client"
import { Button } from "./button"
import useGesture from "@/Hooks/useGesture"
import useVirtualBackground from "@/Hooks/useVirtualBackground"

interface videoProps {
    userType: 'local' | 'remote',
    localStreamRef?: React.RefObject<HTMLVideoElement | null>,
    videoStreamRef?: MediaStream | null,
    name?: RemoteParticipant,
    isMedia?: { audio: boolean, video: boolean }
    roomRef: React.RefObject<Room | null>
}

const VideoTile = ({ userType, localStreamRef, videoStreamRef, name, isMedia, roomRef }: videoProps) => {

    const [isSpeaking, setIsSpeaking] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    const { isGestureEnabled, isGestureRecognizer, setisGestureEnabled } = useGesture({ userType, localStreamRef })
    const { isVirtualEnabled, setIsVirtualEnabled } = useVirtualBackground({ userType, localStreamRef, canvasRef })

    useEffect(() => {
        if (userType === 'remote' && name) {
            const updateSpeaking = () => {
                setIsSpeaking(name.isSpeaking)
            }

            // Listen for speaking changes
            name.on('isSpeakingChanged', updateSpeaking)

            // Set initial state
            updateSpeaking()

            return () => {
                name.off('isSpeakingChanged', updateSpeaking)
            }
        } else if (userType === 'local' && roomRef.current) {
            const localParticipant = roomRef.current.localParticipant

            const updateLocalSpeaking = () => {
                setIsSpeaking(localParticipant.isSpeaking)
            }

            localParticipant.on('isSpeakingChanged', updateLocalSpeaking)
            updateLocalSpeaking()

            return () => {
                localParticipant.off('isSpeakingChanged', updateLocalSpeaking)
            }
        }
    }, [name, userType, roomRef])

    useEffect(() => {
        if (videoRef && videoRef.current && videoStreamRef) {
            videoRef.current.srcObject = videoStreamRef
        }
    }, [videoStreamRef])

    return (
        <div className={`flex-1 min-w-60 self-start h-auto aspect-video relative rounded-lg max-w-80 ${isSpeaking ? "border-green-400 border-4" : "border-gray-400 border-2"} bg-black overflow-hidden transition-all duration-500 ease-in-out`}>
            <div className="absolute z-10 flex p-2 justify-between w-full">
                <h6 className="text-sm font-semibold text-accent-foreground">
                    {userType === 'local' ? "You" : name?.identity || 'user'}
                    {isSpeaking && " 🎤"}
                </h6>
                {
                    userType === 'remote' &&
                    <div className="text-accent-foreground flex gap-1">
                        {
                            isMedia?.audio ?
                                <Mic size={20} /> :
                                <MicOff size={20} />
                        }
                        {
                            isMedia?.video ?
                                <Video size={20} /> :
                                <VideoOff size={20} />
                        }
                    </div>
                }
            </div>
            {
                <>
                    <video
                        ref={userType === 'local' ? localStreamRef : videoRef}
                        muted={userType === 'local'}
                        playsInline
                        autoPlay
                        onLoadedMetadata={() => userType === 'local' ? localStreamRef?.current?.play() : videoRef.current?.play()}
                        style={{
                            transform: 'scaleX(-1)',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: userType === 'local' && isVirtualEnabled ? 'none' : 'block'
                        }}
                    />
                    <canvas
                        ref={canvasRef}
                        style={{
                            transform: 'scaleX(-1)',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                </>
            }
            {
                userType === 'local' &&
                <div className="absolute z-10 bottom-2 w-full flex justify-between gap-1 px-2">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="size-9 rounded-full"
                        onClick={() => setisGestureEnabled(!isGestureEnabled)}
                    >
                        {
                            <Hand size={20} />
                        }
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="size-9 rounded-full"
                        onClick={() => setIsVirtualEnabled(!isVirtualEnabled)}
                    >
                        {
                            <Hand size={20} />
                        }
                    </Button>
                    {isGestureRecognizer?.gestures.map((handGestures, handIndex) => (
                        <h1 key={handIndex} className="text-2xl text-black font-bold">
                            {handGestures[0]?.categoryName}
                        </h1>
                    ))}
                </div>
            }
        </div>
    )
}

export default VideoTile