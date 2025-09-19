import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

import '../database/database.dart';
import '../network/api_client.dart';
import '../utils/logger.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  AppDatabase? _database;
  ApiClient? _apiClient;
  bool _isInitialized = false;

  StreamController<NotificationMessage>? _notificationController;
  StreamController<int>? _badgeController;

  /// Initialize the notification service
  Future<void> initialize({
    required AppDatabase database,
    required ApiClient apiClient,
  }) async {
    if (_isInitialized) return;

    _database = database;
    _apiClient = apiClient;
    _notificationController = StreamController<NotificationMessage>.broadcast();
    _badgeController = StreamController<int>.broadcast();

    try {
      await _initializeLocalNotifications();
      await _initializeFirebaseMessaging();
      await _requestPermissions();

      _isInitialized = true;
      Logger.info('NotificationService initialized successfully');
    } catch (e, stackTrace) {
      Logger.error('Failed to initialize NotificationService', e, stackTrace);
      rethrow;
    }
  }

  /// Get stream of incoming notifications
  Stream<NotificationMessage> get onNotificationReceived {
    _notificationController ??= StreamController<NotificationMessage>.broadcast();
    return _notificationController!.stream;
  }

  /// Get stream of badge count updates
  Stream<int> get onBadgeCountChanged {
    _badgeController ??= StreamController<int>.broadcast();
    return _badgeController!.stream;
  }

  /// Request notification permissions
  Future<bool> requestPermissions() async {
    return await _requestPermissions();
  }

  /// Get current notification permission status
  Future<bool> hasPermissions() async {
    final status = await Permission.notification.status;
    return status.isGranted;
  }

  /// Register device for push notifications
  Future<void> registerDevice(String deviceId) async {
    try {
      final token = await _firebaseMessaging.getToken();
      if (token == null) {
        throw Exception('Failed to get FCM token');
      }

      final platform = Platform.isAndroid ? 'android' : 'ios';

      await _apiClient?.registerPushToken({
        'token': token,
        'device_id': deviceId,
        'platform': platform,
      });

      Logger.info('Device registered for push notifications');
    } catch (e, stackTrace) {
      Logger.error('Failed to register device for push notifications', e, stackTrace);
      rethrow;
    }
  }

  /// Unregister device from push notifications
  Future<void> unregisterDevice(String deviceId) async {
    try {
      await _apiClient?.revokePushToken({'device_id': deviceId});
      await _firebaseMessaging.deleteToken();

      Logger.info('Device unregistered from push notifications');
    } catch (e, stackTrace) {
      Logger.error('Failed to unregister device', e, stackTrace);
    }
  }

  /// Show local notification
  Future<void> showLocalNotification({
    required String title,
    required String body,
    Map<String, dynamic>? data,
    String? channelId,
    String? channelName,
    String? channelDescription,
    NotificationImportance importance = NotificationImportance.defaultImportance,
  }) async {
    try {
      final androidDetails = AndroidNotificationDetails(
        channelId ?? 'default',
        channelName ?? 'Default',
        channelDescription: channelDescription ?? 'Default notification channel',
        importance: _mapImportance(importance),
        priority: Priority.defaultPriority,
        showWhen: true,
        enableVibration: true,
        playSound: true,
      );

      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      final details = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      await _localNotifications.show(
        DateTime.now().millisecondsSinceEpoch ~/ 1000,
        title,
        body,
        details,
        payload: data != null ? jsonEncode(data) : null,
      );

      Logger.info('Local notification shown: $title');
    } catch (e, stackTrace) {
      Logger.error('Failed to show local notification', e, stackTrace);
    }
  }

  /// Get app notifications from database
  Future<List<AppNotification>> getNotifications({
    int limit = 50,
    int offset = 0,
    bool unreadOnly = false,
  }) async {
    try {
      final notifications = await _database!.getNotifications(
        limit: limit,
        offset: offset,
        unreadOnly: unreadOnly,
      );

      return notifications;
    } catch (e, stackTrace) {
      Logger.error('Failed to get notifications', e, stackTrace);
      return [];
    }
  }

  /// Mark notification as read
  Future<void> markAsRead(int notificationId) async {
    try {
      await _database!.markNotificationAsRead(notificationId);
      await _updateBadgeCount();

      Logger.info('Notification marked as read: $notificationId');
    } catch (e, stackTrace) {
      Logger.error('Failed to mark notification as read', e, stackTrace);
    }
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    try {
      await _database!.markAllNotificationsAsRead();
      await _updateBadgeCount();

      Logger.info('All notifications marked as read');
    } catch (e, stackTrace) {
      Logger.error('Failed to mark all notifications as read', e, stackTrace);
    }
  }

  /// Get unread notification count
  Future<int> getUnreadCount() async {
    try {
      return await _database!.getUnreadNotificationCount();
    } catch (e, stackTrace) {
      Logger.error('Failed to get unread count', e, stackTrace);
      return 0;
    }
  }

  /// Clear all notifications
  Future<void> clearAllNotifications() async {
    try {
      await _localNotifications.cancelAll();
      await _database!.deleteAllNotifications();
      await _updateBadgeCount();

      Logger.info('All notifications cleared');
    } catch (e, stackTrace) {
      Logger.error('Failed to clear notifications', e, stackTrace);
    }
  }

  /// Handle background message (static method required by Firebase)
  static Future<void> handleBackgroundMessage(RemoteMessage message) async {
    Logger.info('Background message received: ${message.messageId}');

    // Store notification in database for later display
    try {
      final database = AppDatabase();
      await database.storeNotification(
        title: message.notification?.title ?? 'New Notification',
        body: message.notification?.body ?? '',
        data: message.data,
        receivedAt: DateTime.now(),
      );
    } catch (e) {
      Logger.error('Failed to store background notification', e);
    }
  }

  /// Initialize local notifications
  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onLocalNotificationTapped,
    );

    // Create notification channels for Android
    if (Platform.isAndroid) {
      await _createNotificationChannels();
    }
  }

  /// Initialize Firebase Messaging
  Future<void> _initializeFirebaseMessaging() async {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification taps when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Handle notification tap when app is terminated
    final initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }

    // Set background message handler
    FirebaseMessaging.onBackgroundMessage(handleBackgroundMessage);

    // Set foreground notification presentation options for iOS
    await _firebaseMessaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  /// Request notification permissions
  Future<bool> _requestPermissions() async {
    // Request Firebase Messaging permissions
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus != AuthorizationStatus.authorized) {
      Logger.warning('Firebase Messaging permission denied');
      return false;
    }

    // Request notification permission on Android 13+
    if (Platform.isAndroid) {
      final status = await Permission.notification.request();
      if (!status.isGranted) {
        Logger.warning('Android notification permission denied');
        return false;
      }
    }

    return true;
  }

  /// Create notification channels for Android
  Future<void> _createNotificationChannels() async {
    const channels = [
      AndroidNotificationChannel(
        'default',
        'Default',
        description: 'Default notification channel',
        importance: Importance.defaultImportance,
      ),
      AndroidNotificationChannel(
        'report_updates',
        'Report Updates',
        description: 'Notifications about report status changes',
        importance: Importance.high,
      ),
      AndroidNotificationChannel(
        'system',
        'System',
        description: 'System notifications',
        importance: Importance.max,
      ),
    ];

    for (final channel in channels) {
      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }
  }

  /// Handle foreground messages
  void _handleForegroundMessage(RemoteMessage message) {
    Logger.info('Foreground message received: ${message.messageId}');

    // Store in database
    _storeNotification(message);

    // Show local notification
    _showNotificationFromRemoteMessage(message);

    // Emit to stream
    _notificationController?.add(NotificationMessage.fromRemoteMessage(message));

    // Update badge count
    _updateBadgeCount();
  }

  /// Handle notification tap
  void _handleNotificationTap(RemoteMessage message) {
    Logger.info('Notification tapped: ${message.messageId}');

    // Emit to stream with tap action
    _notificationController?.add(
      NotificationMessage.fromRemoteMessage(message, isTapped: true),
    );
  }

  /// Handle local notification tap
  void _onLocalNotificationTapped(NotificationResponse response) {
    Logger.info('Local notification tapped: ${response.id}');

    if (response.payload != null) {
      try {
        final data = jsonDecode(response.payload!);
        _notificationController?.add(
          NotificationMessage.fromJson(data, isTapped: true),
        );
      } catch (e) {
        Logger.error('Failed to parse notification payload', e);
      }
    }
  }

  /// Store notification in database
  Future<void> _storeNotification(RemoteMessage message) async {
    try {
      await _database!.storeNotification(
        title: message.notification?.title ?? 'New Notification',
        body: message.notification?.body ?? '',
        data: message.data,
        receivedAt: DateTime.now(),
      );
    } catch (e, stackTrace) {
      Logger.error('Failed to store notification', e, stackTrace);
    }
  }

  /// Show local notification from remote message
  Future<void> _showNotificationFromRemoteMessage(RemoteMessage message) async {
    final channelId = message.data['channel'] ?? 'default';
    final channelName = _getChannelName(channelId);

    await showLocalNotification(
      title: message.notification?.title ?? 'New Notification',
      body: message.notification?.body ?? '',
      data: message.data,
      channelId: channelId,
      channelName: channelName,
      importance: _getImportanceFromChannel(channelId),
    );
  }

  /// Update badge count
  Future<void> _updateBadgeCount() async {
    try {
      final count = await getUnreadCount();
      _badgeController?.add(count);

      // Update app icon badge (iOS)
      if (Platform.isIOS) {
        await _localNotifications
            .resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()
            ?.requestPermissions(badge: true);
      }
    } catch (e, stackTrace) {
      Logger.error('Failed to update badge count', e, stackTrace);
    }
  }

  /// Get channel name from channel ID
  String _getChannelName(String channelId) {
    switch (channelId) {
      case 'report_updates':
        return 'Report Updates';
      case 'system':
        return 'System';
      default:
        return 'Default';
    }
  }

  /// Get importance from channel ID
  NotificationImportance _getImportanceFromChannel(String channelId) {
    switch (channelId) {
      case 'system':
        return NotificationImportance.max;
      case 'report_updates':
        return NotificationImportance.high;
      default:
        return NotificationImportance.defaultImportance;
    }
  }

  /// Map importance enum to Android importance
  Importance _mapImportance(NotificationImportance importance) {
    switch (importance) {
      case NotificationImportance.min:
        return Importance.min;
      case NotificationImportance.low:
        return Importance.low;
      case NotificationImportance.defaultImportance:
        return Importance.defaultImportance;
      case NotificationImportance.high:
        return Importance.high;
      case NotificationImportance.max:
        return Importance.max;
    }
  }

  /// Dispose resources
  void dispose() {
    _notificationController?.close();
    _badgeController?.close();
  }
}

/// Notification importance levels
enum NotificationImportance {
  min,
  low,
  defaultImportance,
  high,
  max,
}

/// Notification message wrapper
class NotificationMessage {
  final String title;
  final String body;
  final Map<String, dynamic> data;
  final DateTime receivedAt;
  final bool isTapped;

  const NotificationMessage({
    required this.title,
    required this.body,
    required this.data,
    required this.receivedAt,
    this.isTapped = false,
  });

  factory NotificationMessage.fromRemoteMessage(
    RemoteMessage message, {
    bool isTapped = false,
  }) {
    return NotificationMessage(
      title: message.notification?.title ?? 'New Notification',
      body: message.notification?.body ?? '',
      data: message.data,
      receivedAt: DateTime.now(),
      isTapped: isTapped,
    );
  }

  factory NotificationMessage.fromJson(
    Map<String, dynamic> json, {
    bool isTapped = false,
  }) {
    return NotificationMessage(
      title: json['title'] ?? 'New Notification',
      body: json['body'] ?? '',
      data: Map<String, dynamic>.from(json['data'] ?? {}),
      receivedAt: DateTime.tryParse(json['receivedAt'] ?? '') ?? DateTime.now(),
      isTapped: isTapped,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'body': body,
      'data': data,
      'receivedAt': receivedAt.toIso8601String(),
      'isTapped': isTapped,
    };
  }
}

/// App notification model for database storage
class AppNotification {
  final int id;
  final String title;
  final String body;
  final Map<String, dynamic> data;
  final DateTime receivedAt;
  final bool isRead;

  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.data,
    required this.receivedAt,
    required this.isRead,
  });
}