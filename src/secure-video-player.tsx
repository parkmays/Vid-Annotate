import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import Hls from 'hls.js';
import dashjs from 'dashjs';

const SecureVideoPlayer = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [annotations, setAnnotations] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeEntities, setActiveEntities] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Your specific URLs
  const HLS_URL = "https://storage.googleapis.com/dugmlobjectracking/video_chunks/output/manifest.m3u8";
  const DASH_URL = "https://storage.googleapis.com/dugmlobjectracking/video_chunks/output/manifest.mpd";
  const ANNOTATIONS_URL = "https://storage.cloud.google.com/dugmlobjectracking/%20-%201729799355.9680784.json";

  useEffect(() => {
    const initPlayer = async () => {
      const video = videoRef.current;
      
      try {
        // Load annotations first
        const annotationsResponse = await fetch(ANNOTATIONS_URL, {
          headers: {
            'Access-Control-Allow-Origin': 'https://gitit.me',
            'Origin': 'https://gitit.me'
          }
        });
        
        if (!annotationsResponse.ok) {
          throw new Error('Failed to load annotations');
        }
        
        const annotationsData = await annotationsResponse.json();
        setAnnotations(annotationsData);

        // Initialize video player based on browser support
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            xhrSetup: (xhr) => {
              xhr.setRequestHeader('Range', 'bytes=0-');
              xhr.setRequestHeader('Origin', 'https://gitit.me');
            }
          });
          
          hls.loadSource(HLS_URL);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
          });
          
          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS Error:', data);
            if (data.fatal) {
              // Try DASH as fallback
              initDashPlayer();
            }
          });
        }
        else if (dashjs.supportsMediaSource()) {
          initDashPlayer();
        }
        // Native HLS support (Safari)
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = HLS_URL;
          video.addEventListener('loadedmetadata', () => {
            setLoading(false);
          });
        }
        else {
          throw new Error('No supported playback technology');
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    const initDashPlayer = () => {
      const dashPlayer = dashjs.MediaPlayer().create();
      dashPlayer.initialize(videoRef.current, DASH_URL, true);
      dashPlayer.updateSettings({
        streaming: {
          bufferToKeep: 30,
          bufferPruningInterval: 30,
          stallThreshold: 0.5,
          fastSwitchEnabled: true
        }
      });
      setLoading(false);
    };

    initPlayer();
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !annotations || !videoRef.current) return;

    const drawAnnotations = () => {
      const ctx = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      canvasRef.current.width = video.clientWidth;
      canvasRef.current.height = video.clientHeight;

      const currentTime = video.currentTime;
      const newActiveEntities = new Set();

      if (annotations?.annotation_results?.[0]?.logo_recognition_annotations) {
        annotations.annotation_results[0].logo_recognition_annotations.forEach(annotation => {
          annotation.tracks.forEach(track => {
            track.timestamped_objects.forEach(obj => {
              const timeOffset = obj.time_offset.seconds + (obj.time_offset.nanos / 1000000000);
              
              if (Math.abs(currentTime - timeOffset) < 0.1) {
                const box = obj.normalized_bounding_box;
                
                // Draw bounding box
                ctx.strokeStyle = '#4CAF50';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                  box.left * video.clientWidth,
                  box.top * video.clientHeight,
                  (box.right - box.left) * video.clientWidth,
                  (box.bottom - box.top) * video.clientHeight
                );

                // Draw label background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(
                  box.left * video.clientWidth,
                  box.top * video.clientHeight - 20,
                  annotation.entity.description.length * 8,
                  20
                );
                
                // Draw label text
                ctx.fillStyle = 'white';
                ctx.font = '14px Arial';
                ctx.fillText(
                  annotation.entity.description,
                  box.left * video.clientWidth + 4,
                  box.top * video.clientHeight - 5
                );

                newActiveEntities.add(annotation.entity.description);
              }
            });
          });
        });
      }

      setActiveEntities(newActiveEntities);
    };

    const animationFrame = requestAnimationFrame(drawAnnotations);
    return () => cancelAnimationFrame(animationFrame);
  }, [annotations, currentTime]);

  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error: {error}
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-4">
        <div className="relative">
          <video
            ref={videoRef}
            className="w-full"
            controls
            onTimeUpdate={handleTimeUpdate}
            controlsList="nodownload"
            onContextMenu={e => e.preventDefault()}
            playsInline
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Detected Logos:</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(activeEntities).map((entity) => (
              <span
                key={entity}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {entity}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecureVideoPlayer;