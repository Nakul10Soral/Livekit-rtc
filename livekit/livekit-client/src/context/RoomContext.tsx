import { createContext } from "react";
import type { Media } from "./RoomProvider";


interface RoomContextType {
    media: Media;
    setMedia: React.Dispatch<React.SetStateAction<Media>>;
    token: string | null;
    setToken: React.Dispatch<React.SetStateAction<string | null>>;
}

export const RoomContext = createContext<RoomContextType | null>(null)
