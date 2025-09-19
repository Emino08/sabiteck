import 'dart:async';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/drift.dart';

import '../database/database.dart';
import '../network/api_client.dart';
import 'encryption_service.dart';

class SyncService {
  final AppDatabase _database;
  final ApiClient _apiClient;
  final EncryptionService _encryptionService;
  final Connectivity _connectivity;

  bool _isSyncing = false;
  Timer? _syncTimer;
  StreamController<SyncProgress>? _progressController;

  SyncService({
    required AppDatabase database,
    required ApiClient apiClient,
    required EncryptionService encryptionService,
    Connectivity? connectivity,
  })  : _database = database,
        _apiClient = apiClient,
        _encryptionService = encryptionService,
        _connectivity = connectivity ?? Connectivity();

  /// Start automatic sync with periodic intervals
  void startAutoSync({Duration interval = const Duration(minutes: 5)}) {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(interval, (_) => syncAll());
  }

  /// Stop automatic sync
  void stopAutoSync() {
    _syncTimer?.cancel();
    _syncTimer = null;
  }

  /// Get sync progress stream
  Stream<SyncProgress> get syncProgress {
    _progressController ??= StreamController<SyncProgress>.broadcast();
    return _progressController!.stream;
  }

  /// Check if device is online
  Future<bool> get isOnline async {
    final connectivityResult = await _connectivity.checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  /// Sync all pending data
  Future<SyncResult> syncAll({bool force = false}) async {
    if (_isSyncing && !force) {
      return SyncResult.inProgress();
    }

    if (!await isOnline) {
      return SyncResult.noConnection();
    }

    _isSyncing = true;
    _emitProgress(SyncProgress.started());

    try {
      final result = await _performSync();
      _emitProgress(SyncProgress.completed(result));
      return result;
    } catch (e) {
      final errorResult = SyncResult.error(e.toString());
      _emitProgress(SyncProgress.failed(e.toString()));
      return errorResult;
    } finally {
      _isSyncing = false;
    }
  }

  /// Perform the actual sync operation
  Future<SyncResult> _performSync() async {
    int syncedReports = 0;
    int syncedMedia = 0;
    int failedItems = 0;

    // 1. Sync pending reports
    final pendingReports = await _database.getPendingSyncReports();
    for (final report in pendingReports) {
      try {
        await _syncReport(report);
        syncedReports++;
        _emitProgress(SyncProgress.progress(
          'Synced report ${report.title}',
          syncedReports / pendingReports.length,
        ));
      } catch (e) {
        failedItems++;
        await _handleSyncError(report.id, e.toString());
      }
    }

    // 2. Sync pending media files
    final pendingMediaQuery = _database.select(_database.reportMedia)
      ..where((m) => m.syncStatus.equals('pending'));
    final pendingMedia = await pendingMediaQuery.get();

    for (final media in pendingMedia) {
      try {
        await _syncMedia(media);
        syncedMedia++;
        _emitProgress(SyncProgress.progress(
          'Synced media ${media.fileName}',
          syncedMedia / pendingMedia.length,
        ));
      } catch (e) {
        failedItems++;
        await _handleMediaSyncError(media.id, e.toString());
      }
    }

    // 3. Download server updates for existing reports
    await _downloadServerUpdates();

    // 4. Cleanup old data
    await _database.cleanupOldData();

    return SyncResult.success(
      syncedReports: syncedReports,
      syncedMedia: syncedMedia,
      failedItems: failedItems,
    );
  }

  /// Sync a single report to the server
  Future<void> _syncReport(Report report) async {
    // Mark as syncing
    await _database.update(_database.reports).replace(
      report.copyWith(syncStatus: 'syncing'),
    );

    // Decrypt report data if encrypted
    String title = report.title;
    String description = report.description;

    if (report.isEncrypted && report.encryptionKey != null) {
      final encryptedTitle = EncryptedData.fromJson({
        'data': report.title,
        'iv': report.encryptionKey!,
      });
      final encryptedDescription = EncryptedData.fromJson({
        'data': report.description,
        'iv': report.encryptionKey!,
      });

      title = _encryptionService.decryptText(encryptedTitle);
      description = _encryptionService.decryptText(encryptedDescription);
    }

    // Prepare report data for API
    final reportData = {
      'title': title,
      'description': description,
      'category_id': report.categoryId,
      'incident_date': report.incidentDate?.toIso8601String(),
      'incident_location': report.incidentLocation,
      'is_anonymous': report.isAnonymous,
      'gps_latitude': report.gpsLatitude,
      'gps_longitude': report.gpsLongitude,
      'gps_accuracy': report.gpsAccuracy,
    };

    // Submit to server
    final response = await _apiClient.createReport(reportData);
    final serverCaseId = response['case_id'] as String;

    // Mark as synced in local database
    await _database.markReportAsSynced(report.id, serverCaseId);

    // Add to sync queue for media upload
    final mediaItems = await _database.getReportMedia(report.id);
    for (final media in mediaItems) {
      if (media.syncStatus == 'pending') {
        await _database.addToSyncQueue(
          SyncQueueCompanion.insert(
            itemType: 'media',
            itemId: media.id,
            action: 'upload',
            data: Value(media.filePath),
          ),
        );
      }
    }
  }

  /// Sync a single media file to the server
  Future<void> _syncMedia(ReportMedium media) async {
    // Get associated report
    final report = await _database.getReportById(media.reportId);
    if (report == null || report.serverCaseId == null) {
      throw Exception('Parent report not synced yet');
    }

    // Mark as uploading
    await _database.update(_database.reportMedia).replace(
      media.copyWith(syncStatus: 'uploading'),
    );

    // Decrypt file if needed
    String filePath = media.filePath;
    if (media.isEncrypted && media.encryptionIv != null) {
      filePath = await _encryptionService.decryptFile(
        media.filePath,
        media.encryptionIv!,
      );
    }

    try {
      // Verify file integrity
      final isValid = await _encryptionService.verifyFileIntegrity(
        filePath,
        media.fileHash,
      );

      if (!isValid) {
        throw Exception('File integrity check failed');
      }

      // Upload to server with progress tracking
      final serverMediaId = await _apiClient.uploadReportMedia(
        report.serverCaseId!,
        File(filePath),
        onProgress: (progress) {
          _updateMediaUploadProgress(media.id, progress);
        },
      );

      // Mark as synced
      await _database.update(_database.reportMedia).replace(
        media.copyWith(
          syncStatus: 'synced',
          serverMediaId: Value(serverMediaId),
          syncedAt: Value(DateTime.now()),
          uploadProgress: 1.0,
        ),
      );

      // Clean up decrypted temporary file
      if (filePath != media.filePath) {
        await _encryptionService.secureDeleteFile(filePath);
      }
    } catch (e) {
      // Clean up decrypted temporary file on error
      if (filePath != media.filePath) {
        await _encryptionService.secureDeleteFile(filePath);
      }
      rethrow;
    }
  }

  /// Download updates from server for existing reports
  Future<void> _downloadServerUpdates() async {
    final syncedReports = await (_database.select(_database.reports)
          ..where((r) => r.syncStatus.equals('synced') & r.serverCaseId.isNotNull()))
        .get();

    for (final report in syncedReports) {
      try {
        final serverReport = await _apiClient.getReport(report.serverCaseId!);

        // Update local report with server status
        if (serverReport['status'] != report.status) {
          await _database.update(_database.reports).replace(
            report.copyWith(
              status: serverReport['status'],
              updatedAt: DateTime.now(),
            ),
          );
        }
      } catch (e) {
        // Continue with other reports if one fails
        continue;
      }
    }
  }

  /// Handle sync error for a report
  Future<void> _handleSyncError(int reportId, String error) async {
    final report = await _database.getReportById(reportId);
    if (report == null) return;

    final retryCount = report.syncRetries + 1;
    const maxRetries = 3;

    await _database.update(_database.reports).replace(
      report.copyWith(
        syncStatus: retryCount >= maxRetries ? 'failed' : 'pending',
        syncRetries: retryCount,
        syncError: Value(error),
      ),
    );
  }

  /// Handle sync error for media
  Future<void> _handleMediaSyncError(int mediaId, String error) async {
    await (_database.update(_database.reportMedia)
          ..where((m) => m.id.equals(mediaId)))
        .write(ReportMediaCompanion(
          syncStatus: const Value('failed'),
          uploadProgress: const Value(0.0),
        ));
  }

  /// Update media upload progress
  Future<void> _updateMediaUploadProgress(int mediaId, double progress) async {
    await (_database.update(_database.reportMedia)
          ..where((m) => m.id.equals(mediaId)))
        .write(ReportMediaCompanion(
          uploadProgress: Value(progress),
        ));
  }

  /// Emit sync progress to listeners
  void _emitProgress(SyncProgress progress) {
    _progressController?.add(progress);
  }

  /// Dispose resources
  void dispose() {
    _syncTimer?.cancel();
    _progressController?.close();
  }
}

class SyncResult {
  final bool success;
  final int syncedReports;
  final int syncedMedia;
  final int failedItems;
  final String? error;

  const SyncResult({
    required this.success,
    this.syncedReports = 0,
    this.syncedMedia = 0,
    this.failedItems = 0,
    this.error,
  });

  factory SyncResult.success({
    int syncedReports = 0,
    int syncedMedia = 0,
    int failedItems = 0,
  }) =>
      SyncResult(
        success: true,
        syncedReports: syncedReports,
        syncedMedia: syncedMedia,
        failedItems: failedItems,
      );

  factory SyncResult.error(String error) => SyncResult(
        success: false,
        error: error,
      );

  factory SyncResult.noConnection() => const SyncResult(
        success: false,
        error: 'No internet connection',
      );

  factory SyncResult.inProgress() => const SyncResult(
        success: false,
        error: 'Sync already in progress',
      );
}

class SyncProgress {
  final String status;
  final String? message;
  final double? progress;
  final bool isCompleted;
  final bool isFailed;
  final SyncResult? result;

  const SyncProgress({
    required this.status,
    this.message,
    this.progress,
    this.isCompleted = false,
    this.isFailed = false,
    this.result,
  });

  factory SyncProgress.started() => const SyncProgress(
        status: 'started',
        message: 'Starting sync...',
      );

  factory SyncProgress.progress(String message, double progress) => SyncProgress(
        status: 'progress',
        message: message,
        progress: progress,
      );

  factory SyncProgress.completed(SyncResult result) => SyncProgress(
        status: 'completed',
        message: 'Sync completed successfully',
        progress: 1.0,
        isCompleted: true,
        result: result,
      );

  factory SyncProgress.failed(String error) => SyncProgress(
        status: 'failed',
        message: error,
        isFailed: true,
      );
}