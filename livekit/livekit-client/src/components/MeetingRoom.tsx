import { useRoom } from "@/Hooks/useRoom"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Room, Track, RemoteParticipant, TrackPublication, Participant } from "livekit-client"
import VideoTile from "./ui/VideoTile"
import { Button } from "./ui/button"

const LIVEKIT_WS_URL = "ws://localhost:7880"

const MeetingRoom = () => {
    const { id: roomId } = useParams()
    const { token, media, getMedia } = useRoom()
    const navigate = useNavigate()

    const roomRef = useRef<Room | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const localStreamRef = useRef<HTMLVideoElement | null>(null)

    const [participants, setParticipants] = useState<Map<string, RemoteParticipant>>(new Map())

    const LeaveRoom = () => {
        if (roomRef.current) {
            roomRef.current.disconnect()
            roomRef.current.removeAllListeners()
            navigate('/')
        }
    }

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

                getMedia(localStreamRef)

                setParticipants(new Map(room.remoteParticipants))

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
        if (!roomRef.current) return

        const room = roomRef.current

        const handleTrackSubscribed = (track: Track, _publication: TrackPublication, participant: RemoteParticipant) => {
            console.log("Track subscribed:", track.kind, participant.identity)
            setParticipants(prev => new Map(prev.set(participant.identity, participant)))
        }

        const handleTrackUnsubscribed = (track: Track, _publication: TrackPublication, participant: RemoteParticipant) => {
            console.log("Track unsubscribed:", track.kind, participant.identity)
            const hasActiveTracks = participant.videoTrackPublications.size > 0 ||
                participant.audioTrackPublications.size > 0

            if (!hasActiveTracks) {
                setParticipants(prev => {
                    const newMap = new Map(prev)
                    newMap.delete(participant.identity)
                    return newMap
                })
            } else {
                setParticipants(prev => new Map(prev.set(participant.identity, participant)))
            }
        }

        const handleParticipantConnected = (participant: RemoteParticipant) => {
            console.log("Participant connected:", participant.identity)
            setParticipants(prev => new Map(prev.set(participant.identity, participant)))
        }

        const handleParticipantDisconnected = (participant: RemoteParticipant) => {
            console.log("Participant disconnected:", participant.identity)
            setParticipants(prev => {
                const newMap = new Map(prev)
                newMap.delete(participant.identity)
                return newMap
            })
        }

        const handleTrackMuted = (_publication: TrackPublication, participant: Participant) => {
            console.log("Track muted:", participant.identity)
            if (participant instanceof RemoteParticipant) {
                setParticipants(prev => new Map(prev.set(participant.identity, participant)))
            }
        }

        const handleTrackUnmuted = (_publication: TrackPublication, participant: Participant) => {
            console.log("Track unmuted:", participant.identity)
            if (participant instanceof RemoteParticipant) {
                setParticipants(prev => new Map(prev.set(participant.identity, participant)))
            }
        }

        room.on("trackSubscribed", handleTrackSubscribed)
        room.on("trackUnsubscribed", handleTrackUnsubscribed)
        room.on("participantConnected", handleParticipantConnected)
        room.on("participantDisconnected", handleParticipantDisconnected)
        room.on("trackMuted", handleTrackMuted)
        room.on("trackUnmuted", handleTrackUnmuted)

        return () => {
            room.off("trackSubscribed", handleTrackSubscribed)
            room.off("trackUnsubscribed", handleTrackUnsubscribed)
            room.off("participantConnected", handleParticipantConnected)
            room.off("participantDisconnected", handleParticipantDisconnected)
            room.off("trackMuted", handleTrackMuted)
            room.off("trackUnmuted", handleTrackUnmuted)
        }
    }, [roomRef.current])

    return (
        <div ref={containerRef} className="dark relative min-h-screen w-full bg-[var(--background)]">
            <div className="flex justify-between items-center p-2 mb-4 bg-accent">
                <h1 className="text-xl text-accent-foreground">Room Id: {roomId}</h1>
                <h1 className="text-xl text-accent-foreground">
                    Participants: {participants.size + 1}
                </h1>
                <div className="flex gap-2">
                    <Button variant={'secondary'} onClick={LeaveRoom} className="bg-red-600">
                        Leave Room
                    </Button>
                </div>
            </div>

            <div className="absolute bottom-4 right-4">
                <VideoTile
                    localStreamRef={localStreamRef}
                    userType="local"
                    roomRef={roomRef}
                />
            </div>

            <div className="flex flex-wrap gap-2 justify-center items-center">
                {[...participants.values()].map((participant) => {
                    const videoPublication = Array.from(participant.videoTrackPublications.values())[0]
                    const videoTrack = videoPublication?.track

                    const audioPublication = Array.from(participant.audioTrackPublications.values())[0]
                    const audioTrack = audioPublication?.track

                    const tracks = []
                    if (videoTrack?.mediaStreamTrack) tracks.push(videoTrack.mediaStreamTrack)
                    if (audioTrack?.mediaStreamTrack) tracks.push(audioTrack.mediaStreamTrack)

                    const mediaStream = tracks.length > 0 ? new MediaStream(tracks) : null
                    const isMediaStreaming = {
                        audio: participant.isMicrophoneEnabled,
                        video: participant.isCameraEnabled
                    }

                    return (
                        <VideoTile
                            key={participant.identity}
                            videoStreamRef={mediaStream}
                            userType="remote"
                            name={participant}
                            isMedia={isMediaStreaming}
                            roomRef={roomRef}
                        />
                    )
                })}
            </div>
        </div>
    )
}

export default MeetingRoom