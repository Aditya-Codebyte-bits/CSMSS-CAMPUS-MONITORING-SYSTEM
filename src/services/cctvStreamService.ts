import { CctvCameraFeed } from '../types';

export const CAMPUS_CCTV_FEEDS: CctvCameraFeed[] = [
  {
    id: 'cam_gate3_buffer',
    code: 'CAM-01',
    name: 'Gate 3 Emergency Clearance & Fire Exit Buffer',
    location: 'West Campus Entry · Engineering & Workshop Flank',
    zoneId: 1,
    type: 'simulated_rtsp',
    resolution: '1920x1080 @ 30fps',
    framerate: 30,
    isActive: true,
  },
  {
    id: 'cam_gate2_highway',
    code: 'CAM-02',
    name: 'Gate 2 Inbound Checkpoint (CSMSS Rd Highway)',
    location: 'East Campus Transit · Polytechnic Entrance',
    zoneId: 2,
    type: 'simulated_rtsp',
    resolution: '1920x1080 @ 30fps',
    framerate: 30,
    isActive: true,
  },
  {
    id: 'cam_central_spine',
    code: 'CAM-03',
    name: 'Central Campus Spine & Dental Corridor',
    location: 'Midway Connector between Dental & Ayurveda Hospital',
    zoneId: 5,
    type: 'simulated_rtsp',
    resolution: '1920x1080 @ 25fps',
    framerate: 25,
    isActive: true,
  },
  {
    id: 'cam_parking_bay',
    code: 'CAM-04',
    name: 'Faculty & Student Automated Parking Deck',
    location: 'Northeast Parking Bay Corridor',
    zoneId: 7,
    type: 'simulated_rtsp',
    resolution: '1920x1080 @ 25fps',
    framerate: 25,
    isActive: true,
  },
  {
    id: 'cam_live_webcam',
    code: 'CAM-LIVE',
    name: 'Live Device Camera (Operator Edge ANPR)',
    location: 'Local Edge Terminal / Watchman Gatehouse Tablet',
    zoneId: 1,
    type: 'webcam',
    resolution: 'Live Hardware Sensor',
    framerate: 30,
    isActive: false,
  },
];

export class CctvStreamService {
  private activeWebcamStream: MediaStream | null = null;

  public async startWebcam(): Promise<MediaStream> {
    if (this.activeWebcamStream) {
      return this.activeWebcamStream;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment',
      },
      audio: false,
    });
    this.activeWebcamStream = stream;
    return stream;
  }

  public stopWebcam(): void {
    if (this.activeWebcamStream) {
      this.activeWebcamStream.getTracks().forEach((track) => track.stop());
      this.activeWebcamStream = null;
    }
  }

  public getWebcamStream(): MediaStream | null {
    return this.activeWebcamStream;
  }
}

export const cctvStreamService = new CctvStreamService();
