import React, { useRef } from "react";
import SoundDataTransfer from "../../lib/SoundDataTransfer";

const SoundAnalyzer = () => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleFile = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const audioBlob = new Blob([reader.result], { type: file.type });
        console.log("Audio Blob:", audioBlob);

        const soundDataTransfer = new SoundDataTransfer();

        soundDataTransfer
          .decode(audioBlob)
          .then((message) => console.log(message));
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: "2px dashed #ccc",
          borderRadius: "5px",
          padding: "20px",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        Drag and drop an audio file here or
        <input
          type='file'
          accept='audio/*'
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: "none" }}
        />
        <button onClick={() => fileInputRef.current.click()}>
          Select File
        </button>
      </div>
    </div>
  );
};

export default SoundAnalyzer;
