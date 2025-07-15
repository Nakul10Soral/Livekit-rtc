import express from 'express'
import cors from 'cors'
import { AccessToken } from 'livekit-server-sdk'

const app = express()
const PORT = 3001

app.use(express.json())
app.use(cors())

const apiKey = 'devkey'
const apiSecret = 'pUgDP1GEGZ8uAzE9aFqbyq1c+zHJuF1qQqxD2xhG9F8='

app.post('/user-token', async (req, res) => {
  const { email, roomId, name } = req.body

  if (!email, !roomId) {
    return res.status(400).json({ error: 'email and roomId are required' })
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: name || email
    })

    const videoGrant = {
      room: roomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    };

    at.addGrant(videoGrant)

    const token = await at.toJwt();
    return res.status(200).json({ message: 'Token generated successfully', token })

  } catch (error) {
    console.error('Token generation error:', err)
    res.status(500).json({ error: "internal server error" })
  }
})

app.listen(PORT, () => {
  console.log(`✅ LiveKit Token API running at http://localhost:${PORT}`)
})
