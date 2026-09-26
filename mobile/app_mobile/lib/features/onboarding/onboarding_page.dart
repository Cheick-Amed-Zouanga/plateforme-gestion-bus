import 'package:flutter/material.dart';
import '../../core/services/auth_service.dart';
import '../../core/storage/session_storage.dart';
import '../../core/theme/app_theme.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _controller = PageController();
  int _index = 0;

  static const _slides = [
    (
      icon: Icons.directions_bus_filled_rounded,
      title: 'Multi-compagnies',
      subtitle: 'Comparez les trajets de plusieurs compagnies burkinabè en un seul endroit.',
    ),
    (
      icon: Icons.event_seat_rounded,
      title: 'Réservez simplement',
      subtitle: 'Choisissez votre ville, l’horaire et votre siège en quelques gestes.',
    ),
    (
      icon: Icons.qr_code_2_rounded,
      title: 'Votre billet QR',
      subtitle: 'Recevez un billet avec identifiant unique, prêt pour le contrôle à bord.',
    ),
  ];

  Future<void> _finishAndGo(String route) async {
    await SessionStorage.instance.setOnboardingDone();
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, route);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => _finishAndGo('/welcome'),
                child: const Text('Passer'),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _slides.length,
                onPageChanged: (i) => setState(() => _index = i),
                itemBuilder: (context, i) {
                  final s = _slides[i];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 120,
                          height: 120,
                          decoration: BoxDecoration(
                            color: AppColors.primaryBlue.withValues(alpha: 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(s.icon, size: 64, color: AppColors.primaryBlue),
                        ),
                        const SizedBox(height: 40),
                        Text(
                          s.title,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.bold,
                            color: AppColors.navy,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          s.subtitle,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 16,
                            height: 1.45,
                            color: AppColors.textGrey,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(_slides.length, (i) {
                final active = i == _index;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: active ? 22 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: active ? AppColors.primaryBlue : AppColors.borderGrey,
                    borderRadius: BorderRadius.circular(8),
                  ),
                );
              }),
            ),
            const SizedBox(height: 28),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 12),
              child: Column(
                children: [
                  ElevatedButton(
                    onPressed: () => _finishAndGo('/login'),
                    child: const Text('Connexion'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 50),
                      side: const BorderSide(color: AppColors.primaryBlue, width: 1.5),
                      foregroundColor: AppColors.primaryBlue,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onPressed: () => _finishAndGo('/register'),
                    child: const Text('Créer un compte'),
                  ),
                  TextButton(
                    onPressed: () async {
                      await SessionStorage.instance.setOnboardingDone();
                      await AuthService.instance.continueAsGuest();
                      if (!context.mounted) return;
                      Navigator.pushReplacementNamed(context, '/home');
                    },
                    child: const Text('Continuer sans compte'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
