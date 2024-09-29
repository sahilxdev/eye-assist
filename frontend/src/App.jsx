import SpeechApp from "./SpeechToTextAndTextToSpeech"

function App() {

  return (
    <div className="h-screen flex flex-col items-center justify-between p-4">
      <h1 className="text-2xl md:text-3xl font-bold text-center bg-slate-200 p-3 rounded-xl border-2 shadow-md">
        Speech-to-Text & Text-to-Speech App
      </h1>
      <SpeechApp />
    </div>
  )
}

export default App
