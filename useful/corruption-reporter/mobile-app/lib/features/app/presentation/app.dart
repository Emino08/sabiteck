import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../auth/presentation/bloc/auth_bloc.dart';
import '../../auth/presentation/pages/login_page.dart';
import '../../home/presentation/pages/home_page.dart';
import '../../../core/utils/logger.dart';

class AppWrapper extends StatefulWidget {
  const AppWrapper({super.key});

  @override
  State<AppWrapper> createState() => _AppWrapperState();
}

class _AppWrapperState extends State<AppWrapper> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    // Handle app lifecycle changes for security and sync
    switch (state) {
      case AppLifecycleState.resumed:
        Logger.info('App resumed');
        // Trigger auth check when app comes to foreground
        context.read<AuthBloc>().add(const AuthCheckRequested());
        break;
      case AppLifecycleState.paused:
        Logger.info('App paused');
        // Could implement auto-lock functionality here
        break;
      case AppLifecycleState.detached:
        Logger.info('App detached');
        break;
      case AppLifecycleState.inactive:
        Logger.info('App inactive');
        break;
      case AppLifecycleState.hidden:
        Logger.info('App hidden');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        return AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: _buildPageForState(state),
        );
      },
    );
  }

  Widget _buildPageForState(AuthState state) {
    if (state is AuthLoading) {
      return const _LoadingPage();
    } else if (state is AuthAuthenticated) {
      return const HomePage();
    } else {
      return const LoginPage();
    }
  }
}

class _LoadingPage extends StatelessWidget {
  const _LoadingPage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.primary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App logo
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: const Icon(
                Icons.security,
                size: 60,
                color: Color(0xFF1E40AF),
              ),
            ),
            const SizedBox(height: 32),

            // App name
            const Text(
              'Corruption Reporter',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),

            // Tagline
            Text(
              'Secure • Anonymous • Trusted',
              style: TextStyle(
                fontSize: 16,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
            const SizedBox(height: 48),

            // Loading indicator
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
            const SizedBox(height: 16),

            Text(
              'Initializing secure connection...',
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withOpacity(0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}