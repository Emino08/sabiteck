import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:firebase_core/firebase_core.dart';

import 'core/database/database.dart';
import 'core/services/encryption_service.dart';
import 'core/services/sync_service.dart';
import 'core/network/api_client.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/reports/presentation/bloc/reports_bloc.dart';
import 'features/app/presentation/app.dart';
import 'core/config/app_config.dart';
import 'core/utils/logger.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp();

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize core services
  await _initializeServices();

  // Run the app
  runApp(const CorruptionReporterApp());
}

/// Initialize all core services before running the app
Future<void> _initializeServices() async {
  try {
    Logger.info('Initializing core services...');

    // Initialize encryption service
    await EncryptionService().initialize();
    Logger.info('Encryption service initialized');

    // Initialize database
    final database = AppDatabase();
    await database.customStatement('PRAGMA foreign_keys = ON;');
    Logger.info('Database initialized');

    // Initialize API client
    ApiClient.initialize(AppConfig.apiBaseUrl);
    Logger.info('API client initialized');

    Logger.info('All core services initialized successfully');
  } catch (e, stackTrace) {
    Logger.error('Failed to initialize services', e, stackTrace);
    rethrow;
  }
}

class CorruptionReporterApp extends StatelessWidget {
  const CorruptionReporterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<AppDatabase>(
          create: (context) => AppDatabase(),
        ),
        RepositoryProvider<EncryptionService>(
          create: (context) => EncryptionService(),
        ),
        RepositoryProvider<ApiClient>(
          create: (context) => ApiClient.instance,
        ),
        RepositoryProvider<SyncService>(
          create: (context) => SyncService(
            database: context.read<AppDatabase>(),
            apiClient: context.read<ApiClient>(),
            encryptionService: context.read<EncryptionService>(),
          ),
        ),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider<AuthBloc>(
            create: (context) => AuthBloc(
              database: context.read<AppDatabase>(),
              apiClient: context.read<ApiClient>(),
              encryptionService: context.read<EncryptionService>(),
            )..add(const AuthCheckRequested()),
          ),
          BlocProvider<ReportsBloc>(
            create: (context) => ReportsBloc(
              database: context.read<AppDatabase>(),
              syncService: context.read<SyncService>(),
              encryptionService: context.read<EncryptionService>(),
            ),
          ),
        ],
        child: MaterialApp(
          title: 'Corruption Reporter',
          debugShowCheckedModeBanner: false,
          theme: _buildTheme(),
          home: const AppWrapper(),
        ),
      ),
    );
  }

  ThemeData _buildTheme() {
    const primaryColor = Color(0xFF1E40AF); // Blue-700
    const accentColor = Color(0xFF DC2626); // Red-600

    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.light,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          side: const BorderSide(color: primaryColor),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Colors.grey),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Colors.grey),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: accentColor),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedItemColor: primaryColor,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: Colors.grey[900],
        contentTextStyle: const TextStyle(color: Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
      ),
      fontFamily: 'Inter',
    );
  }
}