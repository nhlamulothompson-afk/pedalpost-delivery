interface RaceHudProps {
  raceState: "countdown" | "racing" | "finished";
  countdown: number;
  raceTime: number;
  speed: number;
  trackName: string;
  carName: string;
}

export default function RaceHud({
  raceState,
  countdown,
  raceTime,
  speed,
  trackName,
  carName,
}: RaceHudProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {raceState === "countdown" && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-9xl font-bold text-white animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      {raceState === "countdown" && countdown === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-7xl font-bold text-primary animate-pulse">
            GO!
          </div>
        </div>
      )}

      {raceState === "racing" && (
        <>
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 space-y-2">
            <div className="text-white">
              <div className="text-sm text-gray-400">Track</div>
              <div className="font-semibold">{trackName}</div>
            </div>
            <div className="text-white">
              <div className="text-sm text-gray-400">Car</div>
              <div className="font-semibold">{carName}</div>
            </div>
          </div>

          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-4 space-y-2">
            <div className="text-white">
              <div className="text-sm text-gray-400">Time</div>
              <div className="text-2xl font-bold font-mono">
                {formatTime(raceTime)}
              </div>
            </div>
            <div className="text-white">
              <div className="text-sm text-gray-400">Speed</div>
              <div className="text-xl font-bold">{speed} km/h</div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-6 py-3">
            <div className="text-white text-sm text-center">
              <div className="text-gray-400 mb-1">Controls</div>
              <div className="font-mono">
                W/↑ Accelerate • S/↓ Brake • A/← D/→ Steer
              </div>
            </div>
          </div>
        </>
      )}

      {raceState === "finished" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4">
            <div className="text-4xl font-bold text-primary">
              Race Complete!
            </div>
            <div className="text-2xl text-white">
              Final Time: {formatTime(raceTime)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
