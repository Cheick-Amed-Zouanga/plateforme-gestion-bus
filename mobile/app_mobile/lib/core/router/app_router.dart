import 'package:flutter/material.dart';
import '../../features/auth/login_page.dart';
import '../../features/auth/register_page.dart';
import '../../features/home/home_shell.dart';
import '../../features/onboarding/onboarding_page.dart';
import '../../features/onboarding/welcome_page.dart';

/// Routes nommées de l'application client TERRASO.
class AppRouter {
  static const onboarding = '/onboarding';
  static const welcome = '/welcome';
  static const login = '/login';
  static const register = '/register';
  static const home = '/home';

  static Map<String, WidgetBuilder> get routes => {
        onboarding: (_) => const OnboardingPage(),
        welcome: (_) => const WelcomePage(),
        login: (_) => const LoginPage(),
        register: (_) => const RegisterPage(),
        home: (_) => const HomeShell(),
      };
}
