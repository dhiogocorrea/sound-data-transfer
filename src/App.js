import SoundAnalyzer from "./components/SoundAnalyzer";
import SoundGenerator from "./components/SoundGenerator";

function App() {
  return (
    <div>
      <h1>Generate sound (encode string to audio)</h1>
      <SoundGenerator />
      <h1>Upload audio (decode sound to string)</h1>
      <SoundAnalyzer />
    </div>
  );
}

export default App;
