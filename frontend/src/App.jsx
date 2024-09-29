import SpeechApp from "./SpeechToTextAndTextToSpeech"

function App() {

  return (
    <div className="flex flex-col items-center justify-between p-4 overflow-hidden">
      <h1 className="text-2xl md:text-3xl font-bold text-center bg-slate-200 p-3 rounded-xl border-2 shadow-md">
        Eye-Assist
      </h1>
      <SpeechApp className="w-full"/>
    </div>
  )
}

export default App
