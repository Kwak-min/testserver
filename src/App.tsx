import React, { useState } from 'react';
import axios from 'axios';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [filesList, setFilesList] = useState<any[]>([]);

  // 파일 업로드 핸들러
  const handleFileUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('File uploaded successfully');
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file', error);
      alert('Error uploading file');
    }
  };

  // 파일 목록 불러오기
  const fetchFiles = async () => {
    try {
      const response = await axios.get('http://localhost:5000/files');
      setFilesList(response.data);
    } catch (error) {
      console.error('Error fetching files', error);
    }
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setFile(file);
    }
  };

  return (
    <div className="App">
      <h1>Audio File Upload</h1>

      {/* 파일 선택 */}
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload Audio</button>

      {/* 파일 목록 조회 */}
      <button onClick={fetchFiles}>Load Files</button>
      <ul>
        {filesList.map((file) => (
          <li key={file._id}>
            <strong>{file.originalFileName}</strong>
            <br />
            Text: {file.text}
            <br />
            Date: {new Date(file.uploadDate).toLocaleString()}
            <br />
            Size: {(file.size / 1024).toFixed(2)} KB
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
