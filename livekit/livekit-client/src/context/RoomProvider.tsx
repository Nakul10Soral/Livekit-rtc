import { useState, type ReactNode } from "react";
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

    return (
        <RoomContext.Provider value={{ media, setMedia, token, setToken }}>
            {children}
        </RoomContext.Provider>
    )
}