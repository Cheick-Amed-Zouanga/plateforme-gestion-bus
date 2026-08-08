import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../help/help_page.dart';
import '../profile/profile_page.dart';

class SettingsPage extends StatelessWidget {
  final bool isGuest;
  final String? username;
  final VoidCallback onChanged;

  const SettingsPage({
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
        const Text(
          'Paramètres',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: AppColors.navy,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Compte, aide et préférences.',
          style: TextStyle(color: AppColors.textGrey, fontSize: 14),
        ),
        const SizedBox(height: 20),
        _SettingsTile(
          icon: Icons.person_rounded,
          title: 'Mon profil',
          subtitle: isGuest
              ? 'Mode invité · Se connecter ou créer un compte'
              : (username ?? 'Compte client'),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => Scaffold(
                  appBar: AppBar(title: const Text('Mon profil')),
                  body: ProfilePage(
                    isGuest: isGuest,
                    username: username,
                    onChanged: onChanged,
                  ),
                ),
              ),
            );
          },
        ),
        _SettingsTile(
          icon: Icons.help_outline_rounded,
          title: 'Aide',
          subtitle: 'FAQ, réservation, paiement, billet QR',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const _HelpScreen()),
            );
          },
        ),
        _SettingsTile(
          icon: Icons.info_outline_rounded,
          title: 'À propos',
          subtitle: 'TERRASO · Application client',
          onTap: () {
            showAboutDialog(
              context: context,
              applicationName: 'TERRASO',
              applicationVersion: '1.0.0',
              applicationLegalese: 'Plateforme de gestion de bus',
            );
          },
        ),
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: AppColors.primaryBlue.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.primaryBlue),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.navy),
        ),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textGrey),
        onTap: onTap,
      ),
    );
  }
}

class _HelpScreen extends StatelessWidget {
  const _HelpScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Aide')),
      body: const HelpPage(),
    );
  }
}
