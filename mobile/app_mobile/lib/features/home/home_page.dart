import 'dart:async';

import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class HomePage extends StatefulWidget {
  final bool isGuest;
  final VoidCallback onSearch;
  final VoidCallback onTickets;
  final VoidCallback onSettings;

  const HomePage({
    super.key,
    required this.isGuest,
    required this.onSearch,
    required this.onTickets,
    required this.onSettings,
  });

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _carousel = PageController(viewportFraction: 0.92);
  int _slide = 0;
  Timer? _timer;

  static const _slides = [
    (
      title: 'Voyagez simple',
      subtitle: 'Comparez les compagnies et réservez en quelques taps.',
      colors: [AppColors.primaryBlue, AppColors.navy],
      icon: Icons.directions_bus_filled_rounded,
    ),
    (
      title: 'Votre billet QR',
      subtitle: 'Un identifiant unique prêt pour le contrôle à bord.',
      colors: [AppColors.teal, Color(0xFF0F766E)],
      icon: Icons.qr_code_2_rounded,
    ),
    (
      title: 'Mode invité',
      subtitle: 'Explorez librement. Connectez-vous seulement pour commander.',
      colors: [AppColors.navy, AppColors.primaryBlue],
      icon: Icons.explore_rounded,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!_carousel.hasClients) return;
      final next = (_slide + 1) % _slides.length;
      _carousel.animateToPage(
        next,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _carousel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
      children: [
        Text(
          widget.isGuest ? 'Bienvenue' : 'Bon voyage',
          style: TextStyle(
            color: AppColors.textGrey,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'TERRASO',
          style: TextStyle(
            color: AppColors.navy,
            fontSize: 28,
            fontWeight: FontWeight.w800,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 16),

        // Carrousel
        SizedBox(
          height: 170,
          child: PageView.builder(
            controller: _carousel,
            itemCount: _slides.length,
            onPageChanged: (i) => setState(() => _slide = i),
            itemBuilder: (_, i) {
              final s = _slides[i];
              return Padding(
                padding: const EdgeInsets.only(right: 10),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: s.colors,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              s.title,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              s.subtitle,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontSize: 13,
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(s.icon, color: Colors.white.withValues(alpha: 0.9), size: 52),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(_slides.length, (i) {
            final active = i == _slide;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 18 : 7,
              height: 7,
              decoration: BoxDecoration(
                color: active ? AppColors.primaryBlue : AppColors.borderGrey,
                borderRadius: BorderRadius.circular(8),
              ),
            );
          }),
        ),

        const SizedBox(height: 28),
        const Text(
          'Accès rapide',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: AppColors.navy,
          ),
        ),
        const SizedBox(height: 14),

        // 4 boutons
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.25,
          children: [
            _QuickButton(
              icon: Icons.search_rounded,
              label: 'Rechercher',
              subtitle: 'Trouver un trajet',
              color: AppColors.primaryBlue,
              onTap: widget.onSearch,
            ),
            _QuickButton(
              icon: Icons.confirmation_number_rounded,
              label: 'Mes billets',
              subtitle: 'Voir mes tickets',
              color: AppColors.teal,
              onTap: widget.onTickets,
            ),
            _QuickButton(
              icon: Icons.settings_rounded,
              label: 'Paramètres',
              subtitle: 'Profil, aide & préférences',
              color: AppColors.orange,
              onTap: widget.onSettings,
            ),
            _QuickButton(
              icon: Icons.help_outline_rounded,
              label: 'Aide',
              subtitle: 'FAQ & support',
              color: AppColors.navy,
              onTap: widget.onSettings,
            ),
          ],
        ),

        if (widget.isGuest) ...[
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.tealSoft,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Text(
              'Mode invité : explorez librement. La connexion sera demandée uniquement pour commander.',
              style: TextStyle(color: AppColors.navy, height: 1.4, fontSize: 13),
            ),
          ),
        ],
      ],
    );
  }
}

class _QuickButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _QuickButton({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.borderGrey),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(height: 12),
              Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                  color: AppColors.navy,
                ),
              ),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 12, color: AppColors.textGrey),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
