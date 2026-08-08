import 'package:flutter/material.dart';
import 'core/network/api_client.dart';
import 'core/router/app_router.dart';
import 'core/storage/session_storage.dart';
import 'core/theme/app_theme.dart';
import 'features/home/home_shell.dart';
import 'features/onboarding/onboarding_page.dart';
import 'features/onboarding/welcome_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiClient.instance.init();
  runApp(const TerrasoApp());
}

class TerrasoApp extends StatelessWidget {
  const TerrasoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TERRASO',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      home: const _Bootstrap(),
      routes: AppRouter.routes,
    );
  }
}

class _Bootstrap extends StatefulWidget {
  const _Bootstrap();

  @override
  State<_Bootstrap> createState() => _BootstrapState();
}

class _BootstrapState extends State<_Bootstrap> {
  Widget? _start;

  @override
  void initState() {
    super.initState();
    _resolve();
  }

  Future<void> _resolve() async {
    final session = SessionStorage.instance;
    final onboarded = await session.isOnboardingDone();
    if (!onboarded) {
      setState(() => _start = const OnboardingPage());
      return;
    }
    final auth = await session.isAuthenticated();
    final guest = await session.isGuest();
    if (auth || guest) {
      setState(() => _start = const HomeShell());
    } else {
      setState(() => _start = const WelcomePage());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_start == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    return _start!;
  }
}
