import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class HelpPage extends StatelessWidget {
  const HelpPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: const [
        _HelpTile(
          title: 'Comment réserver ?',
          body:
              'Recherchez un trajet, choisissez un siège puis confirmez. Un compte est requis uniquement pour commander.',
        ),
        _HelpTile(
          title: 'Paiement',
          body:
              'Le billet est émis avec un paiement en attente. Réglez au guichet (espèces, Orange Money ou Moov Money).',
        ),
        _HelpTile(
          title: 'Contrôle à bord',
          body:
              'Présentez le QR code de votre billet (identifiant BF-xxxxxxxx) au contrôleur.',
        ),
        _HelpTile(
          title: 'Mode invité',
          body:
              'Vous pouvez explorer les trajets sans compte. La connexion est demandée au moment de la commande.',
        ),
      ],
    );
  }
}

class _HelpTile extends StatelessWidget {
  final String title;
  final String body;

  const _HelpTile({required this.title, required this.body});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Text(body, style: const TextStyle(height: 1.4, color: AppColors.textGrey)),
          ),
        ],
      ),
    );
  }
}
