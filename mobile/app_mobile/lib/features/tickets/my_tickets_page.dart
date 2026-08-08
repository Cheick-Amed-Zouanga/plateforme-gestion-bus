import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/network/api_client.dart';
import '../../core/services/client_service.dart';
import '../../core/theme/app_theme.dart';
import 'ticket_detail_page.dart';

class MyTicketsPage extends StatefulWidget {
  final bool isGuest;
  final VoidCallback onNeedAuth;

  const MyTicketsPage({
    super.key,
    required this.isGuest,
    required this.onNeedAuth,
  });

  @override
  State<MyTicketsPage> createState() => _MyTicketsPageState();
}

class _MyTicketsPageState extends State<MyTicketsPage> {
  List<Map<String, dynamic>> _billets = [];
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (!widget.isGuest) _load();
  }

  @override
  void didUpdateWidget(covariant MyTicketsPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!widget.isGuest && oldWidget.isGuest) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await ClientService.instance.mesBillets();
      if (!mounted) return;
      setState(() => _billets = list);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Impossible de charger vos billets.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isGuest) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.lock_outline, size: 48, color: AppColors.textGrey),
              const SizedBox(height: 16),
              const Text(
                'Connectez-vous pour voir vos billets.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: widget.onNeedAuth,
                child: const Text('Se connecter'),
              ),
            ],
          ),
        ),
      );
    }

    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!, style: const TextStyle(color: AppColors.errorRed)),
            TextButton(onPressed: _load, child: const Text('Réessayer')),
          ],
        ),
      );
    }
    if (_billets.isEmpty) {
      return const Center(
        child: Text('Aucun billet pour le moment.', style: TextStyle(color: AppColors.textGrey)),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _billets.length,
        itemBuilder: (_, i) {
          final b = _billets[i];
          final depart = DateTime.tryParse(b['depart_prevu']?.toString() ?? '');
          final date = depart != null
              ? DateFormat('dd/MM/yyyy HH:mm').format(depart.toLocal())
              : '';
          final paiement = b['statut_paiement']?.toString() ?? '';
          final enAttente = paiement == 'EN_ATTENTE';
          final paye = paiement == 'PAYE';
          final badgeColor = paye
              ? AppColors.teal
              : enAttente
                  ? AppColors.orange
                  : AppColors.textGrey;
          final badgeLabel = b['statut_paiement_display']?.toString() ??
              (enAttente ? 'En attente' : paiement);

          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: Icon(
                Icons.confirmation_number,
                color: enAttente ? AppColors.orange : AppColors.primaryBlue,
              ),
              title: Text(
                b['numero_billet']?.toString() ?? '',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${b['nom_compagnie'] ?? ''}\n'
                    '${b['arret_depart_ville']} → ${b['arret_arrivee_ville']}\n'
                    '$date',
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: badgeColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      badgeLabel,
                      style: TextStyle(
                        color: badgeColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              isThreeLine: true,
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => TicketDetailPage(
                      numero: b['numero_billet'].toString(),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
