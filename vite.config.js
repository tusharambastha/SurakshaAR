import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'suraksha-chat-api-plugin',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const pathname = req.url ? req.url.split('?')[0].replace(/\/+$/, '') : ''
          if (pathname === '/api/chat' || pathname === '/SurakshaAR/api/chat' || pathname.endsWith('/api/chat')) {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

            if (req.method === 'OPTIONS') {
              res.statusCode = 204
              res.end()
              return
            }

            if (req.method === 'POST') {
              let rawBody = ''
              req.on('data', chunk => { rawBody += chunk })
              req.on('end', async () => {
                try {
                  const { handleChatApi, getGeminiApiKey, SURAKSHA_MITRA_SYSTEM_PROMPT } = await import('./server/chatHandler.js')
                  const payload = JSON.parse(rawBody || '{}')
                  const apiKey = getGeminiApiKey()

                  // If client requests streaming and active Gemini key is present, stream SSE
                  if (payload.stream && apiKey && apiKey !== 'your-gemini-api-key-here') {
                    res.writeHead(200, {
                      'Content-Type': 'text/event-stream; charset=utf-8',
                      'Cache-Control': 'no-cache, no-transform',
                      'Connection': 'keep-alive',
                      'Access-Control-Allow-Origin': '*',
                    })

                    const { GeminiProvider } = await import('./worker/providers/gemini.js')
                    const provider = new GeminiProvider(apiKey)
                    let messages = Array.isArray(payload.messages) ? payload.messages : []
                    if (messages.length === 0 && (payload.query || payload.message)) {
                      messages = [{ role: 'user', content: payload.query || payload.message }]
                    }

                    const stream = await provider.streamResponse({
                      messages: messages.slice(-10),
                      systemPrompt: SURAKSHA_MITRA_SYSTEM_PROMPT
                    })

                    const reader = stream.getReader()
                    while (true) {
                      const { done, value } = await reader.read()
                      if (done) break
                      res.write(value)
                    }
                    res.end()
                    return
                  }

                  const response = await handleChatApi(payload)
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(response))
                } catch (err) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: err.message }))
                }
              })
              return
            }
          }
          next()
        })
      }
    }
  ],
  base: '/SurakshaAR/',
  server: {
    port: 5174,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'three-vendor': ['three'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
})
