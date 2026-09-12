import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/network/api_client.dart';
import '../../core/services/client_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../shared/components/index.dart';
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
      setState(() =>
          _error = 'Impossible de charger vos billets.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _viewTicket(Map<String, dynamic> billet) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => TicketDetailPage(
          numero: billet['numero_billet'].toString(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Guest mode
    if (widget.isGuest) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.xxl,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: AppColors.primaryBlue.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(
                    Icons.lock_outline,
                    size: 40,
                    color: AppColors.primaryBlue,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),
              const Text(
                'Connectez-vous pour voir vos billets',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              const Text(
                'Vos billets sauvegardés apparaîtront ici une fois connecté',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textGrey,
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),
              PrimaryButton(
                label: 'Se connecter',
                onPressed: widget.onNeedAuth,
              ),
            ],
          ),
        ),
      );
    }

    // Loading state
    if (_loading) {
      return Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.lg,
        ),
        child: TicketSkeleton(count: 3),
      );
    }

    // Error state
    if (_error != null) {
      return AppErrorWidget(
        message: _error!,
        title: 'Erreur de chargement',
        onRetry: _load,
      );
    }

    // Empty state
    if (_billets.isEmpty) {
      return NoTicketsEmpty(
        onSearchTrip: () {
          // Naviguer vers la recherche
          // TODO: Implémenter la navigation
        },
      );
    }

    // Billets list
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.lg,
        ),
        itemCount: _billets.length,
        separatorBuilder: (_, __) =>
            const SizedBox(height: AppSpacing.lg),
        itemBuilder: (_, index) {
          final billet = _billets[index];
          return _TicketListItem(
            billet: billet,
            onTap: () => _viewTicket(billet),
          );
        },
      ),
    );
  }
}

/// Ticket List Item Widget
class _TicketListItem extends StatelessWidget {
  final Map<String, dynamic> billet;
  final VoidCallback onTap;

  const _TicketListItem({
    required this.billet,
    required this.onTap,
  });

  String _getPaymentStatus() {
    final status = billet['statut_paiement']?.toString() ?? '';
    return billet['statut_paiement_display']?.toString() ??
        (status == 'EN_ATTENTE' ? 'En attente' : status);
  }

  StatusType _getPaymentStatusType() {
    final status = billet['statut_paiement']?.toString() ?? '';
    if (status == 'PAYE') return StatusType.success;
    if (status == 'EN_ATTENTE') return StatusType.warning;
    if (status == 'ANNULE') return StatusType.error;
    return StatusType.neutral;
  }

  String _getTicketDateTime() {
    try {
      final depart =
          DateTime.tryParse(billet['depart_prevu']?.toString() ?? '');
      if (depart == null) return '—';
      return DateFormat('dd MMM yyyy · HH:mm', 'fr_FR')
          .format(depart.toLocal());
    } catch (_) {
      return '—';
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header avec numéro et statut
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Billet #${billet['numero_billet']}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.navy,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          billet['nom_compagnie'] ?? '—',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textGrey,
                          ),
                        ),
                      ],
                    ),
                  ),
                  StatusBadge(
                    label: _getPaymentStatus(),
                    type: _getPaymentStatusType(),
                    showIcon: true,
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),

              // Route
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          billet['arret_depart_ville'] ?? '—',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.navy,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          'Départ',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textGrey,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.arrow_forward_rounded,
                    color: AppColors.textGrey,
                    size: 20,
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          billet['arret_arrivee_ville'] ?? '—',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.navy,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          'Arrivée',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textGrey,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),

              // Date et heure
              Row(
                children: [
                  const Icon(
                    Icons.schedule_rounded,
                    size: 16,
                    color: AppColors.textGrey,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Text(
                    _getTicketDateTime(),
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textGrey,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
