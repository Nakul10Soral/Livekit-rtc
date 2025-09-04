import { useRoom } from "@/Hooks/useRoom"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Room, Track, RemoteParticipant, TrackPublication, Participant } from "livekit-client"
import VideoTile from "./ui/VideoTile"
import { Button } from "./ui/button"
import { Mic, MicOff, Video, VideoOff } from "lucide-react"

const LIVEKIT_WS_URL = "ws://localhost:7880"

const MeetingRoom = () => {
    const { search } = useLocation()
    const roomId = new URLSearchParams(search).get("room")
    const paramsToken = new URLSearchParams(search).get("token")
    const { token: stateToken, media, getMedia, streamRef } = useRoom()
    const token = stateToken || paramsToken
    const navigate = useNavigate()

    const [audio, setAudio] = useState(media.audio)
    const [video, setVideo] = useState(media.video)
    const roomRef = useRef<Room | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const localStreamRef = useRef<HTMLVideoElement | null>(null)

    const [participants, setParticipants] = useState<Map<string, RemoteParticipant>>(new Map())

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, media, navigate])

    useEffect(() => {
        if (!roomRef.current) return

        const room = roomRef.current

        const handleTrackSubscribed = (_track: Track, _publication: TrackPublication, participant: RemoteParticipant) => {
            setParticipants(prev => new Map(prev.set(participant.identity, participant)))
        }

        const handleTrackUnsubscribed = (_track: Track, _publication: TrackPublication, participant: RemoteParticipant) => {
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
            setParticipants(prev => new Map(prev.set(participant.identity, participant)))
        }

        const handleParticipantDisconnected = (participant: RemoteParticipant) => {
            setParticipants(prev => {
                const newMap = new Map(prev)
                newMap.delete(participant.identity)
                return newMap
            })
        }

        const handleTrackMuted = (_publication: TrackPublication, participant: Participant) => {
            if (participant instanceof RemoteParticipant) {
                setParticipants(prev => new Map(prev.set(participant.identity, participant)))
            }
        }

        const handleTrackUnmuted = (_publication: TrackPublication, participant: Participant) => {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomRef.current])

    return (
        <div ref={containerRef} className="dark relative h-screen max-h-screen w-full bg-[var(--background)] flex flex-col overflow-hidden">
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

            <div>
                <h1>hello</h1>
            </div>

            <div className="flex justify-center flex-1 flex-wrap gap-2 px-4 content-start">
                <VideoTile
                    localStreamRef={localStreamRef}
                    userType="local"
                    roomRef={roomRef}
                />
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

            {/* control footer */}
            <div className="h-max w-full">
                <div className="bg-accent mx-auto my-0 w-max p-2 rounded-t-2xl">
                    <Button
                        variant="secondary"
                        className="h-10 w-12 rounded-full"
                        onClick={toggleVideo}
                    >
                        {video ? (
                            <Video style={{height:"25px", width:'25px'}}  />
                        ) : (
                            <VideoOff style={{height:"25px", width:'25px'}} />
                        )}
                    </Button>

                    <Button
                        variant="secondary"
                        className="h-10 w-12 rounded-full"
                        onClick={toggleAudio}
                    >
                        {audio ? (
                            <Mic style={{height:"25px", width:'25px'}} />
                        ) : (
                            <MicOff style={{height:"25px", width:'25px'}} />
                        )}
                    </Button>

                </div>
            </div>
        </div>
    )
}

export default MeetingRoom