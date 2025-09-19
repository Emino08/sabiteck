import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../providers/emergency_provider.dart';
import '../../providers/location_provider.dart';
import '../../services/camera_service.dart';
import '../../services/location_service.dart';
import '../../widgets/panic_button.dart';
import '../../widgets/emergency_controls.dart';
import '../../utils/constants.dart';

class EmergencyScreen extends ConsumerStatefulWidget {
  const EmergencyScreen({super.key});

  @override
  ConsumerState<EmergencyScreen> createState() => _EmergencyScreenState();
}

class _EmergencyScreenState extends ConsumerState<EmergencyScreen>
    with WidgetsBindingObserver {
  bool _isEmergencyActive = false;
  bool _isPanicCamRecording = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _setupGestureDetection();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _isEmergencyActive) {
      // Resume location tracking if emergency is active
      ref.read(locationProvider.notifier).startTracking();
    }
  }

  void _setupGestureDetection() {
    // Set up shake detection
    ref.read(emergencyProvider.notifier).setupShakeDetection(
      onShakeDetected: _handleShakeEmergency,
    );
  }

  void _handleShakeEmergency() {
    if (!_isEmergencyActive) {
      _triggerEmergency(EmergencyType.shake);
    }
  }

  Future<void> _triggerEmergency(EmergencyType type) async {
    if (_isEmergencyActive) return;

    setState(() {
      _isEmergencyActive = true;
    });

    try {
      // Haptic feedback
      await HapticFeedback.vibrate();

      // Start panic cam if enabled
      if (type == EmergencyType.panic || type == EmergencyType.shake) {
        await _startPanicCam();
      }

      // Get current location
      final position = await LocationService.instance.getCurrentPosition();

      // Create emergency case
      await ref.read(emergencyProvider.notifier).createEmergency(
        incidentType: _getIncidentTypeFromEmergencyType(type),
        location: {
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
        },
        description: _getDescriptionFromEmergencyType(type),
      );

      // Show success feedback
      _showEmergencyConfirmation();

      // Navigate to active emergency screen
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/active-emergency');
      }
    } catch (error) {
      _showEmergencyError(error.toString());
      setState(() {
        _isEmergencyActive = false;
      });
    }
  }

  Future<void> _startPanicCam() async {
    setState(() {
      _isPanicCamRecording = true;
    });

    try {
      await CameraService.instance.startPanicCamRecording(
        duration: AppConstants.panicCamDuration,
        onRecordingComplete: (filePath) {
          ref.read(emergencyProvider.notifier).uploadPanicCamVideo(filePath);
          setState(() {
            _isPanicCamRecording = false;
          });
        },
      );
    } catch (error) {
      setState(() {
        _isPanicCamRecording = false;
      });
    }
  }

  void _showEmergencyConfirmation() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Emergency reported. Help is on the way.'),
        backgroundColor: Colors.green,
        duration: Duration(seconds: 3),
      ),
    );
  }

  void _showEmergencyError(String error) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Failed to report emergency: $error'),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 5),
      ),
    );
  }

  String _getIncidentTypeFromEmergencyType(EmergencyType type) {
    switch (type) {
      case EmergencyType.police:
        return 'police';
      case EmergencyType.fire:
        return 'fire';
      case EmergencyType.medical:
        return 'medical';
      default:
        return 'general';
    }
  }

  String _getDescriptionFromEmergencyType(EmergencyType type) {
    switch (type) {
      case EmergencyType.panic:
        return 'Panic button activated';
      case EmergencyType.shake:
        return 'Emergency triggered by shake gesture';
      case EmergencyType.police:
        return 'Police assistance requested';
      case EmergencyType.fire:
        return 'Fire emergency reported';
      case EmergencyType.medical:
        return 'Medical emergency reported';
      default:
        return 'General emergency';
    }
  }

  @override
  Widget build(BuildContext context) {
    final emergencyState = ref.watch(emergencyProvider);
    final locationState = ref.watch(locationProvider);

    return Scaffold(
      backgroundColor: Colors.red.shade50,
      appBar: AppBar(
        title: const Text('Emergency'),
        backgroundColor: Colors.red.shade600,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              // Status indicator
              if (_isEmergencyActive)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade100,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange.shade300),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.warning, color: Colors.orange),
                      SizedBox(width: 12),
                      Text(
                        'Emergency in progress...',
                        style: TextStyle(
                          fontWeight: FontWeight.medium,
                          color: Colors.orange,
                        ),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 32),

              // Panic button
              Expanded(
                flex: 2,
                child: Center(
                  child: PanicButton(
                    onPressed: () => _triggerEmergency(EmergencyType.panic),
                    isRecording: _isPanicCamRecording,
                    isDisabled: _isEmergencyActive,
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Emergency type buttons
              Expanded(
                child: EmergencyControls(
                  onPolicePressed: () => _triggerEmergency(EmergencyType.police),
                  onFirePressed: () => _triggerEmergency(EmergencyType.fire),
                  onMedicalPressed: () => _triggerEmergency(EmergencyType.medical),
                  isDisabled: _isEmergencyActive,
                ),
              ),

              const SizedBox(height: 24),

              // Location status
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      locationState.isLocationEnabled
                          ? Icons.location_on
                          : Icons.location_off,
                      color: locationState.isLocationEnabled
                          ? Colors.green
                          : Colors.red,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        locationState.isLocationEnabled
                            ? 'Location services active'
                            : 'Location services disabled',
                        style: TextStyle(
                          color: locationState.isLocationEnabled
                              ? Colors.green
                              : Colors.red,
                          fontWeight: FontWeight.medium,
                        ),
                      ),
                    ),
                    if (!locationState.isLocationEnabled)
                      TextButton(
                        onPressed: () {
                          ref.read(locationProvider.notifier).requestPermission();
                        },
                        child: const Text('Enable'),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Instructions
              Text(
                'In an emergency:\n'
                '• Tap the red panic button\n'
                '• Shake your device vigorously\n'
                '• Use the emergency type buttons\n'
                '• Your location will be shared automatically',
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 14,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

enum EmergencyType {
  panic,
  shake,
  police,
  fire,
  medical,
}