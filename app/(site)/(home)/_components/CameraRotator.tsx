'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { gsap } from 'gsap';
import * as THREE from 'three';
import GlobalState from '@/components/common/GlobalStates';
import { useGyroscope, useGyroscopeControl, useDeviceOrientation } from './gyroscope';
import { useCallback } from 'react';

export default function CameraRotator() {
  const { camera } = useThree();
  const { started, isTouchDevice } = GlobalState();
  const { gyroEnabled, gyroActive, setGyroEnabled, setShowPermissionButton, setGyroValues } = useGyroscope();
  const { calculateSpeeds } = useGyroscopeControl();

  const rotationAngleRef = useRef(0);
  const radiusOffsetRef = useRef(0);
  const smoothedPositionRef = useRef(new THREE.Vector3(0, 0, 0));
  const orientationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });

  const controls = useControls('Camera Rotator', {
    radius: { value: 1, min: 0, max: 2, step: 1 },
    speed: { value: 0.2, min: -5, max: 5, step: 0.1 },
    height: { value: 0, min: -2, max: 2, step: 0.01 },
    enabled: true,
    gyroSensitivity: { value: 0.01, min: 0.001, max: 0.05, step: 0.001, label: 'Gyro Sensitivity' }
  }, { collapsed: true });

  const rotateLerpRef = useRef({ value: 0 });

  // Check if permission needs to be requested (only on real touch devices)
  useEffect(() => {
    if (!isTouchDevice || !started || gyroEnabled) return;

    const checkPermission = async () => {
      // Check if we need to request permission (iOS 13+)
      if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        // iOS 13+ - needs user gesture, show button
        setShowPermissionButton(true);
      } else if (typeof DeviceOrientationEvent !== 'undefined') {
        // Android and older iOS - auto-grant
        setGyroEnabled(true);
      }
    };

    checkPermission();
  }, [isTouchDevice, started, gyroEnabled, setShowPermissionButton, setGyroEnabled]);

  // Handle device orientation updates
  const handleOrientationUpdate = useCallback((data: { alpha: number; beta: number; gamma: number }) => {
    orientationRef.current = data;
    setGyroValues(data);
  }, [setGyroValues]);

  // Listen to device motion and orientation events (only on real touch devices)
  useDeviceOrientation(isTouchDevice && gyroEnabled, handleOrientationUpdate);

  // Initialize rotation angle from current camera position when mode changes
  useEffect(() => {
    // Calculate current angle from camera position
    const currentX = camera.position.x;
    const currentZ = camera.position.z;
    const currentAngle = Math.atan2(currentZ, currentX);

    if (gyroActive && isTouchDevice) {
      // Switching to gyro mode: initialize from current position
      rotationAngleRef.current = currentAngle;
      radiusOffsetRef.current = 0;
      smoothedPositionRef.current.copy(camera.position);
    } else if (!gyroActive) {
      // Switching to desktop/auto mode: initialize from current position
      rotationAngleRef.current = currentAngle;
      smoothedPositionRef.current.copy(camera.position);
    }
  }, [gyroActive, isTouchDevice, camera]);

  useEffect(() => {
    if (!started) return;

    const tl = gsap.timeline();
    tl.to(rotateLerpRef.current, {
      value: 1,
      duration: 5,
    });
  }, [started]);

  useFrame((state, delta) => {
    if (!controls.enabled) return;

    if (isTouchDevice && gyroActive) {
      // Touch Device: Gyroscope-controlled camera
      const { beta, gamma } = orientationRef.current;
      const { rotationSpeed, radiusSpeed } = calculateSpeeds(beta, gamma, controls.gyroSensitivity);

      // Accumulate rotation and radius
      if (started) {
        rotationAngleRef.current -= delta * rotationSpeed;
        radiusOffsetRef.current -= delta * radiusSpeed;
        radiusOffsetRef.current = THREE.MathUtils.clamp(radiusOffsetRef.current, -0.8, 0.8);
      }

      // Calculate position
      const effectiveRadius = controls.radius + radiusOffsetRef.current;
      const angle = rotationAngleRef.current;

      const x = effectiveRadius * Math.cos(angle);
      const y = effectiveRadius * Math.sin(angle * 0.5) + controls.height;
      const z = effectiveRadius * Math.sin(angle);

      smoothedPositionRef.current.lerp(new THREE.Vector3(x, y, z), 0.15);
      camera.position.copy(smoothedPositionRef.current);
    } else {
      // Desktop/Auto mode: Original time-based automatic rotation
      const speed = controls.speed * rotateLerpRef.current.value;
      rotationAngleRef.current += (started) ? Math.min(delta, 1 / 30) * speed : 0;

      // Gradually reset radius offset to 0 when switching from gyro mode
      radiusOffsetRef.current = THREE.MathUtils.lerp(radiusOffsetRef.current, 0, 0.05);

      const effectiveRadius = controls.radius + radiusOffsetRef.current;
      const x = effectiveRadius * Math.cos(rotationAngleRef.current);
      const y = effectiveRadius * Math.sin(rotationAngleRef.current * 0.5) + controls.height;
      const z = effectiveRadius * Math.sin(rotationAngleRef.current);

      // Smooth transition when switching from gyro to auto mode
      const targetPosition = new THREE.Vector3(x, y, z);
      smoothedPositionRef.current.lerp(targetPosition, 0.15);
      camera.position.copy(smoothedPositionRef.current);
    }

    camera.lookAt(0, 0, 0);
  });

  return null;
}
