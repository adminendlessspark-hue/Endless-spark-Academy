import React from 'react';
import { useParams } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';

export default function ClassroomClean() {
  const { roomId } = useParams();
  const { jitsiServer } = useSettings();
  
  if (!roomId) return null;

  const baseDomain = jitsiServer ? jitsiServer.replace(/^(https?:\/\/)?/, '').replace(/\/$/, '') : 'jitsi.belnet.be';

  // Jitsi URL with config to hide UI elements for clean recording
  // disableFilmstrip: hides the camera feeds
  // disableDeepLinking: prevents the "Open in App" prompt
  // toolbarButtons: empty array hides the toolbar (can be toggled if needed)
  // resolution/desktopSharingFrameRate: force higher quality screenshare
  const jitsiUrl = `https://${baseDomain}/${roomId}#config.disableFilmstrip=true&config.disableDeepLinking=true&interfaceConfig.TOOLBAR_BUTTONS=[]&config.resolution=1080&config.desktopSharingFrameRate.min=15&config.desktopSharingFrameRate.max=30&config.videoQuality.enforcePreferredCodec=true`;

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
    </div>
  );
}
