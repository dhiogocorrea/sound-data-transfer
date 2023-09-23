import { PitchDetector } from "pitchy";

class AudioData {
  frequencies: number[];
  audioContext: AudioContext;
  duration: number;

  constructor(frequencies: number[], duration: number) {
    this.frequencies = frequencies;
    this.audioContext = new AudioContext();
    this.duration = duration;
  }

  play(destinationNode: MediaStreamAudioDestinationNode = undefined) {
    const oscillatorNodes = this.frequencies.map((frequency) => {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      if (!destinationNode) {
        oscillator.connect(this.audioContext.destination);
      }

      return oscillator;
    });

    oscillatorNodes.forEach((oscillator, index) => {
      const startTime =
        this.audioContext.currentTime + (index * this.duration) / 1000;
      const endTime = startTime + this.duration / 1000;

      oscillator.connect(destinationNode || this.audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(endTime);
    });
  }

  async generateAudio(): Promise<Blob> {
    const durationInSeconds =
      (this.duration * this.frequencies.length) / 1000 + 1;

    const destinationNode = this.audioContext.createMediaStreamDestination();
    this.play(destinationNode);

    const mediaRecorder = new MediaRecorder(destinationNode.stream, {
      mimeType: "audio/webm",
    });

    const recordedChunks = [];

    mediaRecorder.ondataavailable = (event) => recordedChunks.push(event.data);
    mediaRecorder.start();

    setTimeout(() => {
      mediaRecorder.stop();
    }, durationInSeconds * 1000);

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunks, { type: "audio/wav" });
        resolve(audioBlob);
      };

      mediaRecorder.onerror = () => {
        reject(new Error(`MediaRecorder error`));
      };
    });
  }
}

class SoundDataTransfer {
  asciiCharacters: string[];
  audioContext: AudioContext;
  duration: number;

  constructor() {
    this.audioContext = new AudioContext();
    this.duration = 300;

    this.asciiCharacters = [];
    for (let i = 0; i <= 127; i++) {
      this.asciiCharacters.push(String.fromCharCode(i));
    }
  }

  encode(data: string): AudioData {
    const frequencies = btoa(data)
      .split("")
      .map((char) => {
        const indx = this.asciiCharacters.indexOf(char);
        return indx * 20 + 100;
      });

    return new AudioData(frequencies, this.duration);
  }

  async decode(sound: Blob): Promise<string> {
    const audioBuffer = await this.convertBlobToAudioBuffer(sound);
    const chunksBuffer = this.sliceAudioBuffer(audioBuffer);

    const frequencies: number[] = [];
    for (const chunk of chunksBuffer) {
      const frequency = this.getDominantFrequency(chunk);
      frequencies.push(frequency);
    }

    const messageB64 = frequencies.map((freq) => {
      const indx = (freq - 100) / 20;
      return this.asciiCharacters[Math.round(indx)];
    });

    messageB64[messageB64.length - 1] = "=";

    console.log(messageB64);

    return atob(messageB64.join(""));
  }

  getDominantFrequency(audioBuffer: AudioBuffer): number {
    const frequencies: number[] = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      const audioData = audioBuffer.getChannelData(i);

      const pitchObject = PitchDetector.forFloat32Array(audioData.length);
      const frequency = pitchObject.findPitch(
        audioData,
        this.audioContext.sampleRate
      );

      frequencies.push(frequency[0]);
    }

    return Math.max(...frequencies);
  }

  sliceAudioBuffer(audioBuffer: AudioBuffer): Array<AudioBuffer> {
    const chunkSizeInSamples = Math.floor(
      (audioBuffer.sampleRate * this.duration) / 1000
    );
    const totalChunks = Math.ceil(audioBuffer.length / chunkSizeInSamples);

    const buffers: AudioBuffer[] = [];

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const startSample = chunkIndex * chunkSizeInSamples;
      const endSample = Math.min(
        (chunkIndex + 1) * chunkSizeInSamples,
        audioBuffer.length
      );

      const chunkBuffer = this.audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        endSample - startSample,
        audioBuffer.sampleRate
      );

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        const chunkData = chunkBuffer.getChannelData(channel);
        for (let sample = startSample; sample < endSample; sample++) {
          chunkData[sample - startSample] = channelData[sample];
        }
      }

      buffers.push(chunkBuffer);
    }

    return buffers;
  }

  convertBlobToAudioBuffer = (blob: Blob): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        const result = event.target.result;
        if (typeof result === "string") {
          reject(new Error("Failed to read Blob as ArrayBuffer."));
        } else {
          this.audioContext.decodeAudioData(result, resolve, reject);
        }
      };
      fileReader.onerror = (event) => {
        reject(new Error("Error reading Blob as ArrayBuffer."));
      };
      fileReader.readAsArrayBuffer(blob);
    });
  };

  getIndexInAscii(character: string) {
    const index = this.asciiCharacters.indexOf(character);
    return index;
  }
}

export default SoundDataTransfer;
