import { useRoom } from "@/Hooks/useRoom"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Room, Track, RemoteParticipant } from "livekit-client"
import VideoTile from "./ui/VideoTile"

const LIVEKIT_WS_URL = "ws://localhost:7880"

const MeetingRoom = () => {

    const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[] | null>(null)

    const { id: roomId } = useParams()
    const { token, media, setMedia } = useRoom()
    const navigate = useNavigate()

    const roomRef = useRef<Room | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const localStreamRef = useRef<MediaStream | null>(null)


    const toggleAudio = async () => {
        if (roomRef.current) {
            try {
                const newAudioState = !media.audio
                await roomRef.current.localParticipant.setMicrophoneEnabled(newAudioState)
                setMedia(prev => ({ ...prev, audio: newAudioState }))
            } catch (error) {
                console.error("Error toggling audio:", error)
            }
        }
    }

    const toggleVideo = async () => {
        if (roomRef.current) {
            try {
                const newVideoState = !media.video
                await roomRef.current.localParticipant.setCameraEnabled(newVideoState)
                setMedia(prev => ({ ...prev, video: newVideoState }))
            } catch (error) {
                console.error("Error toggling video:", error)
            }
        }
    }

    useEffect(() => {
        if (roomRef.current) {
            const localParticipant = roomRef.current.localParticipant
            const videoPublication = localParticipant.getTrackPublications().find(pub => pub.track?.kind === Track.Kind.Video)
            const videoTrack = videoPublication?.track

            if (videoTrack && videoTrack.mediaStreamTrack) {
                const mediaStream = new MediaStream([videoTrack.mediaStreamTrack])
                localStreamRef.current = mediaStream
            }
        }
    }, [remoteParticipants])

    useEffect(() => {
        if (!token) {
            navigate("/")
            return
        }

        const connect = async () => {
            try {
                const room = new Room()
                roomRef.current = room

                await room.connect(LIVEKIT_WS_URL, token)

                await room.localParticipant.setCameraEnabled(media.video)
                await room.localParticipant.setMicrophoneEnabled(media.audio)

                setRemoteParticipants([...room.remoteParticipants.values()])
            } catch (error) {
                console.error("Error connecting to room:", error)
            }
        }

        connect()

        return () => {
            roomRef.current?.disconnect()
            roomRef.current?.removeAllListeners()
        }
    }, [token, media, navigate])

    useEffect(() => {
        if (roomRef && roomRef.current) {

            const room = roomRef.current

            room.on("trackSubscribed", (track) => {
                if (track.kind === Track.Kind.Video) {
                    setRemoteParticipants([...room.remoteParticipants.values()])
                }
            })

            room.on("trackUnsubscribed", (track) => {
                if (track.kind === Track.Kind.Video) {
                    setRemoteParticipants([...room.remoteParticipants.values()])
                }
            })

            room.on("participantConnected", () => {
                setRemoteParticipants([...room.remoteParticipants.values()])
            })

            room.on("participantMetadataChanged", () => {
                setRemoteParticipants([...room.remoteParticipants.values()])
            })

            room.on("participantDisconnected", () => {
                setRemoteParticipants([...room.remoteParticipants.values()])
            })

            // room.on('trackMuted', () => {

            // })
        }
    }, [])

    return (
        <div ref={containerRef} className="dark relative min-h-screen w-full bg-[var(--background)]">
            <h1 className="text-xl text-accent-foreground">Room Id: {roomId}</h1>
            <div className="absolute bottom-4 right-4">
                {
                    <VideoTile
                        videoStreamRef={localStreamRef.current}
                        userType="local"
                        toggleAudio={toggleAudio}
                        toggleVideo={toggleVideo}
                    />
                }
            </div>
            <div className="flex flex-wrap gap-2 justify-center items-center" >
                {
                    remoteParticipants &&
                    remoteParticipants.map((party, index) => {
                        const videoTrack = party.videoTrackPublications.values().next().value?.track
                        const audioTrack = party.audioTrackPublications.values().next().value?.track

                        const tracks = []
                        if (videoTrack) tracks.push(videoTrack.mediaStreamTrack)
                        if (audioTrack) tracks.push(audioTrack.mediaStreamTrack)

                        const mediaStream = tracks.length > 0 ? new MediaStream(tracks) : null

                        return (
                            <VideoTile
                                key={index}
                                videoStreamRef={mediaStream}
                                userType="remote"
                                name={party.identity}
                            />
                        )
                    })
                }
            </div>
        </div>
    )
}

export default MeetingRoom