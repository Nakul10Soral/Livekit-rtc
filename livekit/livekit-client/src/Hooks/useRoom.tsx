import { RoomContext } from "@/context/RoomContext";
import { useContext } from "react";

export const useRoom = () => {
    const context = useContext(RoomContext);
    if (!context) {
        throw new Error("useRoom must be used within a RoomProvider");
    }
    return context;
};