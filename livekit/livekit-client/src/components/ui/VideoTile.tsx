import { Mic, MicOff, Video, VideoOff } from "lucide-react"
import { Button } from "./button"
import { useRoom } from "@/Hooks/useRoom"
import { useEffect, useRef } from "react"

interface videoProps {
    userType: 'local' | 'remote',
    videoStreamRef: MediaStream | null,
    name?: string,
    toggleAudio?: () => void,
    toggleVideo?: () => void
}

const VideoTile = ({ userType, videoStreamRef, name, toggleAudio, toggleVideo }: videoProps) => {

    const { media } = useRoom()
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef && videoRef.current && videoStreamRef) {
            videoRef.current.srcObject = videoStreamRef
        }
    }, [videoStreamRef])

    return (
        <div className="aspect-video relative rounded-lg w-72 bg-black border-[3px] border-[var(--secondary)] overflow-hidden">
            <div className="absolute z-10 flex p-2 justify-between w-full">
                <h6 className="text-sm font-semibold text-accent-foreground">
                    {userType === 'local' ? "You" : name || 'user'}
                </h6>
                {
                    userType === 'remote' &&
                    <div className="text-accent-foreground">
                        <Mic size={20} />
                    </div>
                }
            </div>
            <video
                ref={videoRef}
                muted={userType === 'local'}
                playsInline
                autoPlay
                onLoadedMetadata={() => videoRef.current?.play()}
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
                            media.video ?
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
                            media.audio ?
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