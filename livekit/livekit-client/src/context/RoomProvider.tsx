import { useCallback, useRef, useState, type ReactNode } from "react";
import { RoomContext } from "./RoomContext";

export interface Media {
    audio: boolean,
    video: boolean
}

export const RoomProvider = ({ children }: { children: ReactNode }) => {
    const [media, setMedia] = useState<Media>({
        audio: false,
        video: true
    })

    const [token, setToken] = useState<string | null>(null)

    const streamRef = useRef<MediaStream | null>(null)

    const getMedia = useCallback(async (videoElementRef: React.RefObject<HTMLVideoElement | null>) => {
        try {
            if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                })

                stream.getAudioTracks().forEach(track => (track.enabled = media.audio))

                streamRef.current = stream

                if (stream && videoElementRef && videoElementRef.current) {
                    videoElementRef.current.srcObject = stream
                }
            }
        } catch (error) {
            console.error('Error getting media', error)
        }
    }, [])

    const toggleVideo = useCallback((media: boolean) => {
        if (streamRef.current) {
            const videoTracks = streamRef.current.getVideoTracks()
            const newVideoState = !media

            videoTracks.forEach(track => {
                track.enabled = newVideoState
            })

            setMedia(prev => ({ ...prev, video: newVideoState }))
        }
    }, [])

    const toggleAudio = useCallback((media: boolean) => {
        if (streamRef.current) {
            const audioTracks = streamRef.current.getAudioTracks()
            const newAudioState = !media

            audioTracks.forEach(track => {
                track.enabled = newAudioState
            })

            setMedia(prev => ({ ...prev, audio: newAudioState }))
        }
    }, [])

    return (
        <RoomContext.Provider value={{ media, setMedia, token, setToken, getMedia, streamRef, toggleAudio, toggleVideo }}>
            {children}
        </RoomContext.Provider>
    )
}