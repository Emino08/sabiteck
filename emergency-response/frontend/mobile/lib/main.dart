import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'src/app.dart';
import 'src/services/notification_service.dart';
import 'src/services/background_service.dart';
import 'src/utils/logger.dart';

// Background message handler for Firebase
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  AppLogger.instance.info('Background message received: ${message.messageId}');
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    // Initialize Firebase
    await Firebase.initializeApp();

    // Initialize Hive for local storage
    await Hive.initFlutter();

    // Set up Firebase messaging background handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Initialize notification service
    await NotificationService.instance.initialize();

    // Initialize background service
    await BackgroundService.instance.initialize();

    // Set preferred orientations
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);

    // Run the app
    runApp(
      const ProviderScope(
        child: EmergencyResponseApp(),
      ),
    );
  } catch (error, stackTrace) {
    AppLogger.instance.error('Error during app initialization', error, stackTrace);

    // Run minimal app in case of initialization error
    runApp(
      const MaterialApp(
        home: Scaffold(
          body: Center(
            child: Text('Failed to initialize app. Please restart.'),
          ),
        ),
      ),
    );
  }
}