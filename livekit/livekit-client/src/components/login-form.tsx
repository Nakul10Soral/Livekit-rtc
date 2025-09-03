import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useRoom } from "@/Hooks/useRoom"
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'
import { useNavigate } from "react-router-dom"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const { setMedia, setToken, media } = useRoom()


  const [joingDetails, setJoiningDetails] = useState({
    email: '',
    roomId: '',
    name: ''
  })

  const [localMediaState, setLocalMediaState] = useState({
    video: media.video,
    audio: media.audio
  })

  const testVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const res = await fetch('https://livekit-token-dksc.onrender.com/user-token', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(joingDetails)
      })
      const data = await res.json()
      if (data.token) {
        setToken(data.token)
        const params = new URLSearchParams({
          room: joingDetails.roomId,
          name: joingDetails.name,
          email: joingDetails.email,
          token: data.token
        })
        navigate(`/room?${params.toString().trim()}`)
      } else {
        alert('error joining room ' + data)
      }
    } catch (error) {
      console.error(error)
      alert(error)
    }
  }

  const getMedia = useCallback(async () => {
    try {
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        })

        stream.getAudioTracks().forEach(track => (track.enabled = localMediaState.audio))

        streamRef.current = stream
        if (testVideoRef.current) {
          testVideoRef.current.srcObject = stream
        }
      }
    } catch (error) {
      console.error('Error getting media', error)
    }
  }, [])

  const toggleVideo = useCallback(() => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks()
      const newVideoState = !localMediaState.video

      videoTracks.forEach(track => {
        track.enabled = newVideoState
      })

      setLocalMediaState(prev => ({ ...prev, video: newVideoState }))
      setMedia(prev => ({ ...prev, video: newVideoState }))
    }
  }, [localMediaState.video, setMedia])

  const toggleAudio = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks()
      const newAudioState = !localMediaState.audio

      audioTracks.forEach(track => {
        track.enabled = newAudioState
      })

      setLocalMediaState(prev => ({ ...prev, audio: newAudioState }))
      setMedia(prev => ({ ...prev, audio: newAudioState }))
    }
  }, [localMediaState.audio, setMedia])

  useEffect(() => {
    getMedia()
    const videoElement = testVideoRef.current;
    return () => {
      if (videoElement && videoElement.srcObject) {
        const tracks = (videoElement.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, [getMedia])

  useEffect(() => {
    
  })

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-3xl", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 order-2 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome to Connect</h1>
                <p className="text-muted-foreground text-balance">
                  Enter your details to join the room
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={joingDetails.email}
                  onChange={(e) => setJoiningDetails(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="name">User Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nuke"
                  required
                  value={joingDetails.name}
                  onChange={(e) => setJoiningDetails(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="roomId">Room Id</Label>
                <Input
                  id="roomId"
                  type="text"
                  placeholder="1234"
                  required
                  value={joingDetails.roomId}
                  onChange={(e) => setJoiningDetails(prev => ({ ...prev, roomId: e.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
          </form>
          <div className="bg-muted relative order-1 overflow-hidden">
            <video
              ref={testVideoRef}
              autoPlay
              playsInline
              loop
              className="w-full h-full object-cover bg-black"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="absolute z-10 bottom-4 w-full flex justify-center gap-4">
              <Button
                variant="secondary"
                size="icon"
                className="size-10 rounded-full"
                onClick={toggleVideo}
              >
                {
                  localMediaState.video ?
                    <Video size={20} /> :
                    <VideoOff size={20} />
                }
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="size-10 rounded-full"
                onClick={toggleAudio}
              >
                {
                  localMediaState.audio ?
                    <Mic size={20} /> :
                    <MicOff size={20} />
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}