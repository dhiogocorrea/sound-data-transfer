import React, { useState } from "react";
import SoundDataTransfer from "../../lib/SoundDataTransfer";

const SoundGenerator = () => {
  const [message, setMessage] = useState<string>();

  const playBeep = (): void => {
    const audioData = new SoundDataTransfer().encode(message || "");

    //audioData.play();
    download(audioData);
  };

  const download = (audioData) => {
    audioData.generateAudio().then((audioBlob) => {
      const audioUrl = URL.createObjectURL(audioBlob);

      const anchor = document.createElement("a");
      anchor.href = audioUrl;
      anchor.download = "audio.wav";
      anchor.click();
      URL.revokeObjectURL(audioUrl);
    });
  };

  return (
    <div>
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <br />
      <button onClick={() => playBeep()}>Play</button>
    </div>
  );
};

export default SoundGenerator;
