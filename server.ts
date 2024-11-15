import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { SpeechClient } from '@google-cloud/speech';
import connectDB from './mongodb';

const app = express();
const port = 5000;

connectDB();

// Google Cloud Speech-to-Text 설정
const client = new SpeechClient({
  keyFilename: 'path/to/your/google-cloud-credentials.json',
});

app.use(express.json());
app.use(express.static('public'));

// Multer 설정 (파일 업로드)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// MongoDB Schema 설정
const fileSchema = new mongoose.Schema({
  originalFileName: String,
  text: String,
  filePath: String,
  uploadDate: { type: Date, default: Date.now },
  size: Number,
});

const File = mongoose.model('File', fileSchema);

// 오디오 파일 업로드 라우트
app.post('/upload', upload.single('audio'), async (req: Request, res: Response) => {
  const audioFile = req.file;
  if (!audioFile) {
    return res.status(400).send('No file uploaded');
  }

  // Google Cloud Speech-to-Text API 호출
  const audio = {
    content: fs.readFileSync(audioFile.path).toString('base64'),
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'ko-KR',
  };
  const request = {
    audio: audio,
    config: config,
  };

  try {
    const [response] = await client.recognize(request);
    const text = response.results
      .map((result) => result.alternatives[0].transcript)
      .join('\n');

    // 파일 정보 DB에 저장
    const newFile = new File({
      originalFileName: audioFile.originalname,
      text,
      filePath: audioFile.path,
      size: audioFile.size,
    });

    await newFile.save();
    res.json({ message: 'File uploaded and transcribed', file: newFile });
  } catch (error) {
    console.error('Error during speech recognition:', error);
    res.status(500).send('Error transcribing the audio');
  }
});

// 업로드된 파일 목록 불러오기
app.get('/files', async (req: Request, res: Response) => {
  try {
    const files = await File.find();
    res.json(files);
  } catch (err) {
    res.status(500).send('Error fetching files');
  }
});

// 서버 실행
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
