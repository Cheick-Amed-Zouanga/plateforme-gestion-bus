import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/login_page.dart';

void main() {
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
      home: const LoginPage(),
      routes: {
        '/login': (_) => const LoginPage(),
        // '/home': (_) => const ClientHomePage(), // à ajouter plus tard
      },
    );
  }
}
