import { Mic, MicOff, Video, VideoOff } from "lucide-react"
import { Button } from "./button"
import { useRoom } from "@/Hooks/useRoom"
import { useCallback, useEffect, useRef, useState } from "react"
import type { RemoteParticipant, Room } from "livekit-client"

interface videoProps {
    userType: 'local' | 'remote',
    localStreamRef?: React.RefObject<HTMLVideoElement | null>,
    videoStreamRef?: MediaStream | null,
    name?: RemoteParticipant,
    isMedia?: { audio: boolean, video: boolean }
    roomRef: React.RefObject<Room | null>
}

const VideoTile = ({ userType, localStreamRef, videoStreamRef, name, isMedia, roomRef }: videoProps) => {

    const { media, streamRef } = useRoom()

    const [audio, setAudio] = useState(media.audio)
    const [video, setVideo] = useState(media.video)
    const [isSpeaking, setIsSpeaking] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)

    const toggleAudio = useCallback(async () => {
        if (roomRef.current) {
            try {
                const newAudioState = !audio
                if (streamRef.current) {
                    const audioTracks = streamRef.current.getAudioTracks()

                    audioTracks.forEach(track => {
                        track.enabled = newAudioState
                    })
                }
                await roomRef.current.localParticipant.setMicrophoneEnabled(newAudioState)
                setAudio(prev => !prev)
            } catch (error) {
                console.error("Error toggling audio:", error)
            }
        }
    }, [audio, roomRef])

    const toggleVideo = useCallback(async () => {
        if (roomRef.current) {
            try {
                const newVideoState = !video
                if (streamRef.current) {
                    const videoTracks = streamRef.current.getVideoTracks()

                    videoTracks.forEach(track => {
                        track.enabled = newVideoState
                    })
                }
                await roomRef.current.localParticipant.setCameraEnabled(newVideoState)
                setVideo(prev => !prev)
            } catch (error) {
                console.error("Error toggling video:", error)
            }
        }
    }, [roomRef, video])

    // Handle speaking state changes
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
        <div className={`aspect-video relative rounded-lg w-72 ${isSpeaking ? "border-green-400 border-4" : "border-gray-400 border-2"
            } bg-black overflow-hidden transition-all duration-500 ease-in-out`}>
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
                    objectFit: 'cover'
                }}
            />
            {
                userType === 'local' &&
                <div className="absolute z-10 bottom-2 w-full flex justify-between gap-1 px-2">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="size-9 rounded-full"
                        onClick={toggleVideo}
                    >
                        {
                            video ?
                                <Video size={20} /> :
                                <VideoOff size={20} />
                        }
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="size-9 rounded-full"
                        onClick={toggleAudio}
                    >
                        {
                            audio ?
                                <Mic size={20} /> :
                                <MicOff size={20} />
                        }
                    </Button>
                </div>
            }
        </div>
    )
}

export default VideoTile