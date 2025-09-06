// import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import React, { useCallback, useEffect, useRef, useState } from "react"
// import { useRoom } from "@/Hooks/useRoom"
// import { Mic, MicOff, Video, VideoOff } from 'lucide-react'
// import { useNavigate } from "react-router-dom"
// import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";

// export function LoginForm({
//     className,
//     ...props
// }: React.ComponentProps<"div">) {
//     const [joingDetails, setJoiningDetails] = useState({
//         email: '',
//         roomId: '',
//         name: ''
//     })

//     const [localMediaState, setLocalMediaState] = useState({
//         video: true,
//         audio: false
//     })

//     const testVideoRef = useRef<HTMLVideoElement>(null)
//     const streamRef = useRef<MediaStream | null>(null)

//     // 🔥 New refs for canvas
//     const canvasRef = useRef<HTMLCanvasElement | null>(null)
//     const contextRef = useRef<CanvasRenderingContext2D | null>(null)

//     const { setMedia, setToken } = useRoom()
//     const navigate = useNavigate()

//     const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//         e.preventDefault()
//         try {
//             const res = await fetch('http://localhost:3001/user-token', {
//                 method: "POST",
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(joingDetails)
//             })
//             const data = await res.json()
//             if (data.token) {
//                 setToken(data.token)
//                 navigate(`/room/${joingDetails.roomId}`)
//             } else {
//                 alert('error joining room ' + data)
//             }
//         } catch (error) {
//             console.error(error)
//             alert(error)
//         }
//     }

//     const getMedia = useCallback(async () => {
//         try {
//             if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
//                 const stream = await navigator.mediaDevices.getUserMedia({
//                     audio: true,
//                     video: true
//                 })

//                 stream.getAudioTracks().forEach(track => (track.enabled = localMediaState.audio))

//                 streamRef.current = stream
//                 if (testVideoRef.current) {
//                     testVideoRef.current.srcObject = stream
//                 }
//             }
//         } catch (error) {
//             console.error('Error getting media', error)
//         }
//     }, [])

//     const toggleVideo = useCallback(() => {
//         if (streamRef.current) {
//             const videoTracks = streamRef.current.getVideoTracks()
//             const newVideoState = !localMediaState.video

//             videoTracks.forEach(track => {
//                 track.enabled = newVideoState
//             })

//             setLocalMediaState(prev => ({ ...prev, video: newVideoState }))
//             setMedia(prev => ({ ...prev, video: newVideoState }))
//         }
//     }, [localMediaState.video, setMedia])

//     const toggleAudio = useCallback(() => {
//         if (streamRef.current) {
//             const audioTracks = streamRef.current.getAudioTracks()
//             const newAudioState = !localMediaState.audio

//             audioTracks.forEach(track => {
//                 track.enabled = newAudioState
//             })

//             setLocalMediaState(prev => ({ ...prev, audio: newAudioState }))
//             setMedia(prev => ({ ...prev, audio: newAudioState }))
//         }
//     }, [localMediaState.audio, setMedia])

//     useEffect(() => {
//         getMedia()

//         // ✅ Setup MediaPipe
//         const selfieSegmentation = new SelfieSegmentation({
//             locateFile: (file) =>
//                 `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
//         })

//         selfieSegmentation.setOptions({
//             modelSelection: 1,
//             selfieMode: true,
//         })

//         selfieSegmentation.onResults((results) => {
//             if (!canvasRef.current || !contextRef.current) return
//             const canvas = canvasRef.current
//             const ctx = contextRef.current

//             ctx.save()
//             ctx.clearRect(0, 0, canvas.width, canvas.height)

//             // Draw segmentation mask
//             ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height)

//             // Fill background (green for now)
//             ctx.globalCompositeOperation = "source-out"
//             ctx.fillStyle = "#00FF00"
//             ctx.fillRect(0, 0, canvas.width, canvas.height)

//             // Draw person on top
//             ctx.globalCompositeOperation = "destination-atop"
//             ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

//             ctx.restore()
//         })

//         const processFrame = async () => {
//             if (testVideoRef.current && testVideoRef.current.videoWidth > 0) {
//                 await selfieSegmentation.send({ image: testVideoRef.current })
//             }
//             requestAnimationFrame(processFrame)
//         }

//         if (canvasRef.current) {
//             contextRef.current = canvasRef.current.getContext("2d")
//             processFrame()
//         }

//         return () => {
//             if (streamRef.current) {
//                 streamRef.current.getTracks().forEach(track => track.stop())
//             }
//         }
//     }, [getMedia])

//     return (
//         <div className={cn("flex flex-col gap-6 w-full max-w-3xl", className)} {...props}>
//             <Card className="overflow-hidden p-0">
//                 <CardContent className="grid p-0 md:grid-cols-2">
//                     <form onSubmit={handleSubmit} className="p-6 md:p-8">
//                         {/* form code unchanged */}
//                     </form>
//                     <div className="bg-muted relative hidden md:block overflow-hidden">
//                         {/* original video hidden behind canvas */}
//                         <video
//                             ref={testVideoRef}
//                             autoPlay
//                             playsInline
//                             muted
//                             className="w-full h-full object-cover bg-black"
//                             style={{ transform: 'scaleX(-1)', display: 'none' }} // 👈 hide original video
//                         />
//                         <canvas
//                             ref={canvasRef}
//                             width={640}
//                             height={480}
//                             className="w-full h-full object-cover bg-black"
//                             style={{ transform: 'scaleX(-1)' }}
//                         />
//                         <div className="absolute z-10 bottom-4 w-full flex justify-center gap-4">
//                             {/* controls unchanged */}
//                         </div>
//                     </div>
//                 </CardContent>
//             </Card>
//         </div>
//     )
// }
