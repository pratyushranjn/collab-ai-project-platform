import './App.css';

function App() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center space-y-5 bg-gray-50 px-4">
      <div className="text-3xl font-bold text-shadow-md text-shadow-sky-300">
        Hello Team 👋
      </div>

      <div className="max-w-xl text-lg leading-relaxed">
        Always push your changes to a <span className="font-semibold text-blue-600">new branch</span> when working on a feature or fix —<br />
        <span className="text-red-600 font-semibold">avoid pushing directly</span> to <code className="bg-gray-200 px-1 py-0.5 rounded">main</code> or <code className="bg-gray-200 px-1 py-0.5 rounded">master</code>.
      </div>

      <div className="max-w-xl text-base text-gray-700">
        Direct pushes can lead to <span className="font-medium text-red-500">merge conflicts</span>, which take extra time to resolve<br />
        and can block the entire team’s progress. Let’s work clean! 🚀
      </div>
    </div>
  );
}

export default App;
