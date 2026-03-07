import { useSettings } from "../contexts/SettingsContext";

export default function LoadingScreen() {
  const { settings } = useSettings();

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-dark-900 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] animate-pulse-slow" />
      
      {/* Animated Logo Container */}
      <div className="relative group">
        {/* Outer Ring Animation */}
        <div className="absolute -inset-8 bg-gradient-to-tr from-accent via-orange-500 to-yellow-400 rounded-full opacity-20 animate-spin-slow blur-xl" />
        
        {/* Core Logo Box */}
        <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Pulsing Flame Glow */}
            <div 
                className="absolute inset-0 rounded-3xl blur-lg opacity-80 animate-pulse" 
                style={{ background: `linear-gradient(to top right, ${settings?.logoColorStart || '#ea580c'}, ${settings?.logoColorEnd || '#dc2626'}, #facc15)` }}
            />
            
            <div className="relative w-full h-full bg-dark-800 rounded-2xl flex items-center justify-center border border-white/10 z-10 shadow-2xl overflow-hidden">
                <span 
                    className="text-5xl font-black bg-clip-text text-transparent transform -skew-x-6 animate-bounce-subtle"
                    style={{ backgroundImage: `linear-gradient(to bottom right, #fcd34d, ${settings?.logoColorStart || '#f97316'}, ${settings?.logoColorEnd || '#dc2626'})` }}
                >
                    {settings?.logoChar || 'S'}
                </span>
                {/* Shine effect passing through */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer" />
            </div>
        </div>
      </div>

      {/* Text Branding */}
      <div className="mt-12 text-center relative z-10">
        <h2 className="text-2xl font-bold text-white tracking-widest uppercase">
            {settings?.appName || "POS System"}
        </h2>
        <div className="mt-3 flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
        </div>
        <p className="mt-4 text-xs text-gray-500 font-medium tracking-[0.2em] uppercase">
            Initializing {settings?.appSubtitle || "Admin Dashboard"}...
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="mt-10 w-64 h-1 bg-dark-700 rounded-full overflow-hidden relative">
        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent to-orange-400 animate-loading-bar" />
      </div>
    </div>
  );
}
