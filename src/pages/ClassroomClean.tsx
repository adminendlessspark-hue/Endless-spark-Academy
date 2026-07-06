import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { Monitor } from 'lucide-react';

export default function ClassroomClean() {
  const { roomId } = useParams();
  const { jitsiServer } = useSettings();
  const [screenshareOptimization, setScreenshareOptimization] = useState<'text' | 'motion'>('text');
  
  if (!roomId) return null;

  const baseDomain = jitsiServer ? jitsiServer.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '') : 'jitsi.belnet.be';

  const minFps = screenshareOptimization === 'text' ? 5 : 15;
  const maxFps = screenshareOptimization === 'text' ? 5 : 30;
  const extraParams = screenshareOptimization === 'text'
    ? `&config.constraints.video.height.ideal=1080&config.constraints.video.width.ideal=1920&config.videoQuality.preferredCodec=vp9&config.videoQuality.maxReceiverVideoQuality=1080`
    : `&config.videoQuality.preferredCodec=vp8`;

  // Jitsi URL with config to hide UI elements for clean recording
  // disableFilmstrip: hides the camera feeds
  // disableDeepLinking: prevents the "Open in App" prompt
  // toolbarButtons: empty array hides the toolbar (can be toggled if needed)
  // resolution/desktopSharingFrameRate: force higher quality screenshare
  const jitsiUrl = `https://${baseDomain}/${roomId}#config.disableFilmstrip=true&config.disableDeepLinking=true&interfaceConfig.TOOLBAR_BUTTONS=[]&config.resolution=1080&config.desktopSharingFrameRate.min=${minFps}&config.desktopSharingFrameRate.max=${maxFps}&config.videoQuality.enforcePreferredCodec=true${extraParams}`;

  return (
    <div className="fixed inset-0 bg-black">
      <iframe
        src={jitsiUrl}
        allow="camera; microphone; display-capture; autoplay; clipboard-write"
        className="w-full h-full border-none"
        title="Clean Classroom View"
      />
      <div className="fixed top-4 left-4 z-50 pointer-events-none">
        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
          CLEAN RECORDING VIEW
        </div>
      </div>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-white shadow-lg">
        <Monitor className="w-3.5 h-3.5 text-pink-500 shrink-0" />
        <span className="text-slate-400 font-semibold hidden sm:inline">Screen Quality:</span>
        <select
          value={screenshareOptimization}
          onChange={(e) => setScreenshareOptimization(e.target.value as 'text' | 'motion')}
          className="bg-transparent text-slate-200 font-bold focus:ring-0 focus:outline-none border-none py-0.5 cursor-pointer pr-6 text-xs outline-none"
          title="Optimize screen share for text readability (low frame rate, high resolution) or smooth video motion"
        >
          <option value="text" className="bg-slate-950 text-slate-200">Text & Slides (Crisp 1080p)</option>
          <option value="motion" className="bg-slate-950 text-slate-200">Video & Motion (Smooth FPS)</option>
        </select>
      </div>
    </div>
  );
}
