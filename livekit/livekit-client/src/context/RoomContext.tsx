import { createContext } from "react";
import type { Media } from "./RoomProvider";


interface RoomContextType {
    media: Media;
    setMedia: React.Dispatch<React.SetStateAction<Media>>;
    token: string | null;
    setToken: React.Dispatch<React.SetStateAction<string | null>>;
    getMedia: (videoElementRef: React.RefObject<HTMLVideoElement | null>) => Promise<void>;
    streamRef: React.RefObject<MediaStream | null>;
    toggleAudio: (media: boolean) => void;
    toggleVideo: (media: boolean) => void;
}

export const RoomContext = createContext<RoomContextType | null>(null)