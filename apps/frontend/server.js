// apps/frontend/server.js
const express = require('express')
const next = require('next')
const multer = require('multer')
const fs = require('fs')
const pdfParse = require('pdf-parse')
const OpenAI = require('openai')

const upload = multer({ dest: 'pdf-uploads/' })
const DATA_FILE = 'pdf-uploads/data.json'

if (!fs.existsSync('pdf-uploads')) fs.mkdirSync('pdf-uploads', { recursive: true })
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  server.post('/api/upload', upload.single('pdf'), async (req, res) => {
    if (!req.file || req.file.mimetype !== 'application/pdf' || req.file.size > 5_000_000) {
      return res
        .status(400)
        .json({ error: 'Invalid file. Must be a PDF under 5MB.' })
    }
    try {
      const buffer = await fs.promises.readFile(req.file.path)
      await fs.promises.unlink(req.file.path)
      const pdfData = await pdfParse(buffer)
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('Missing OPENAI_API_KEY')
      }
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Extract main topics and create five practice questions from the given text. Respond in JSON with {"topics":[],"questions":[]}',
          },
          { role: 'user', content: pdfData.text.slice(0, 4000) },
        ],
      })
      let parsed
      try {
        parsed = JSON.parse(completion.choices[0].message.content)
      } catch (e) {
        parsed = { response: completion.choices[0].message.content }
      }
      const entries = JSON.parse(await fs.promises.readFile(DATA_FILE, 'utf8'))
      entries.push({ file: req.file.filename, data: parsed })
      await fs.promises.writeFile(DATA_FILE, JSON.stringify(entries, null, 2))
      res.json({ success: true, data: parsed })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Failed to process PDF' })
    }
  })

  server.all('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
