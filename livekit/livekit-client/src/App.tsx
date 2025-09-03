import { Route, Routes } from "react-router-dom"
import HomeRoom from "./components/HomeRoom"
import MeetingRoom from "./components/MeetingRoom"
import { RoomProvider } from "./context/RoomProvider"

const App = () => {
  return (
    <RoomProvider>
      <Routes>
        <Route path="/" element={<HomeRoom />} />
        <Route path="/room" element={<MeetingRoom />} />
      </Routes>
    </RoomProvider>
  )
}

export default App