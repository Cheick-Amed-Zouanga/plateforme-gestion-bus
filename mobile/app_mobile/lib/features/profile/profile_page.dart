import 'package:flutter/material.dart';
import '../../core/services/auth_service.dart';
import '../../core/theme/app_theme.dart';

class ProfilePage extends StatelessWidget {
  final bool isGuest;
  final String? username;
  final VoidCallback onChanged;

  const ProfilePage({
    super.key,
    required this.isGuest,
    required this.username,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        CircleAvatar(
          radius: 40,
          backgroundColor: AppColors.primaryBlue.withValues(alpha: 0.15),
          child: Icon(
            isGuest ? Icons.person_outline : Icons.person,
            size: 40,
            color: AppColors.primaryBlue,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          isGuest ? 'Invité' : (username ?? 'Client'),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Text(
          isGuest
              ? 'Créez un compte pour commander et retrouver vos billets.'
              : 'Compte client TERRASO',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.textGrey),
        ),
        const SizedBox(height: 28),
        if (isGuest) ...[
          ElevatedButton(
            onPressed: () async {
              await Navigator.pushNamed(context, '/login');
              onChanged();
            },
            child: const Text('Se connecter'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () async {
              await Navigator.pushNamed(context, '/register');
              onChanged();
            },
            child: const Text('Créer un compte'),
          ),
        ] else
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.errorRed),
            onPressed: () async {
              await AuthService.instance.logout();
              if (!context.mounted) return;
              Navigator.pushNamedAndRemoveUntil(context, '/welcome', (_) => false);
            },
            child: const Text('Se déconnecter'),
          ),
      ],
    );
  }
}
