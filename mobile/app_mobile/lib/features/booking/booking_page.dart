import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import '../../core/services/client_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../shared/components/index.dart';
import '../tickets/ticket_detail_page.dart';

/// Ouvre la confirmation de commande en feuille modale.
Future<void> showBookingSheet(
  BuildContext context, {
  required Map<String, dynamic> trajet,
  required int siegeId,
  required String siegeNumero,
  required int arretDepart,
  required int arretArrivee,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => BookingSheet(
      trajet: trajet,
      siegeId: siegeId,
      siegeNumero: siegeNumero,
      arretDepart: arretDepart,
      arretArrivee: arretArrivee,
    ),
  );
}

class BookingSheet extends StatefulWidget {
  final Map<String, dynamic> trajet;
  final int siegeId;
  final String siegeNumero;
  final int arretDepart;
  final int arretArrivee;
  final bool embedded;

  const BookingSheet({
    super.key,
    required this.trajet,
    required this.siegeId,
    required this.siegeNumero,
    required this.arretDepart,
    required this.arretArrivee,
    this.embedded = false,
  });

  @override
  State<BookingSheet> createState() => _BookingSheetState();
}

/// Page pleine (fallback) — la confirmation s'ouvre plutôt via [showBookingSheet].
class BookingPage extends StatelessWidget {
  final Map<String, dynamic> trajet;
  final int siegeId;
  final String siegeNumero;
  final int arretDepart;
  final int arretArrivee;

  const BookingPage({
    super.key,
    required this.trajet,
    required this.siegeId,
    required this.siegeNumero,
    required this.arretDepart,
    required this.arretArrivee,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Confirmer')),
      body: BookingSheet(
        trajet: trajet,
        siegeId: siegeId,
        siegeNumero: siegeNumero,
        arretDepart: arretDepart,
        arretArrivee: arretArrivee,
        embedded: true,
      ),
    );
  }
}

class _BookingSheetState extends State<BookingSheet> {
  String _mode = 'ESPECES';
  bool _loading = false;
  String? _error;

  Future<void> _confirm() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await ClientService.instance.commander(
        trajet: widget.trajet['id'] as int,
        siege: widget.siegeId,
        arretDepart: widget.arretDepart,
        arretArrivee: widget.arretArrivee,
        modePaiement: _mode,
      );
      if (!mounted) return;
      final numero = result['numero_billet']?.toString() ?? '';
      if (!widget.embedded) {
        Navigator.of(context).pop();
      }
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (_) => TicketDetailPage(
            numero: numero,
            initialData: result,
          ),
        ),
        (route) => route.isFirst,
      );
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Commande impossible pour le moment.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.trajet;
    final bottom = MediaQuery.paddingOf(context).bottom;
    final maxH = MediaQuery.sizeOf(context).height * 0.92;

    final scroll = ListView(
      shrinkWrap: true,
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        0,
        AppSpacing.lg,
        AppSpacing.lg + bottom,
      ),
      children: [
        // Modal handle (si modal)
        if (!widget.embedded) ...[
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppSpacing.lg),
              decoration: BoxDecoration(
                color: AppColors.borderGrey,
                borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
              ),
            ),
          ),
        ],

        // Header
        Row(
          children: [
            const Expanded(
              child: Text(
                'Confirmer la réservation',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            if (!widget.embedded)
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(
                  Icons.close_rounded,
                  color: AppColors.textGrey,
                ),
              ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),

        // Trip summary card
        _TripSummaryCard(
          trajet: t,
          seatNumber: widget.siegeNumero,
        ),
        const SizedBox(height: AppSpacing.xxl),

        // Details card
        _BookingDetailsCard(
          trajet: t,
          seatNumber: widget.siegeNumero,
        ),
        const SizedBox(height: AppSpacing.xxl),

        // Payment method
        const Text(
          'Mode de paiement',
          style: TextStyle(
            color: AppColors.navy,
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        ..._paymentOptions(),
        const SizedBox(height: AppSpacing.xl),

        // Info message
        CompactInfoCard(
          message:
              'Votre billet sera généré immédiatement. Paiement en attente à la confirmation.',
          type: InfoCardType.info,
        ),

        // Error message
        if (_error != null) ...[
          const SizedBox(height: AppSpacing.lg),
          CompactInfoCard(
            message: _error!,
            type: InfoCardType.error,
          ),
        ],

        const SizedBox(height: AppSpacing.xxl),

        // Confirm button
        PrimaryButton(
          label: 'Confirmer et obtenir mon billet',
          isLoading: _loading,
          onPressed: _loading ? null : _confirm,
        ),
      ],
    );

    if (widget.embedded) return scroll;

    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        constraints: BoxConstraints(maxHeight: maxH),
        decoration: const BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.vertical(
            top: Radius.circular(AppSpacing.radiusRound),
          ),
        ),
        child: scroll,
      ),
    );
  }

  List<Widget> _paymentOptions() {
    const options = [
      ('ESPECES', 'Espèces', Icons.payments_outlined),
      ('ORANGE_MONEY', 'Orange Money', Icons.phone_android_rounded),
      ('MOOV_MONEY', 'Moov Money', Icons.account_balance_wallet_outlined),
    ];

    return options.map((m) {
      final selected = _mode == m.$1;
      return Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => setState(() => _mode = m.$1),
            borderRadius:
                BorderRadius.circular(AppSpacing.radiusMedium),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.lg,
                vertical: AppSpacing.md,
              ),
              decoration: BoxDecoration(
                color: selected
                    ? AppColors.primaryBlue.withValues(alpha: 0.08)
                    : AppColors.surface,
                borderRadius:
                    BorderRadius.circular(AppSpacing.radiusMedium),
                border: Border.all(
                  color: selected
                      ? AppColors.primaryBlue
                      : AppColors.borderGrey,
                  width: selected ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    m.$3,
                    color: selected
                        ? AppColors.primaryBlue
                        : AppColors.textGrey,
                    size: 22,
                  ),
                  const SizedBox(width: AppSpacing.lg),
                  Expanded(
                    child: Text(
                      m.$2,
                      style: TextStyle(
                        color: AppColors.navy,
                        fontWeight: selected
                            ? FontWeight.w600
                            : FontWeight.w500,
                      ),
                    ),
                  ),
                  Icon(
                    selected
                        ? Icons.check_circle_rounded
                        : Icons.circle_outlined,
                    color: selected
                        ? AppColors.primaryBlue
                        : AppColors.borderGrey,
                    size: 22,
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }).toList();
  }
}

// Trip Summary Card
class _TripSummaryCard extends StatelessWidget {
  final Map<String, dynamic> trajet;
  final String seatNumber;

  const _TripSummaryCard({
    required this.trajet,
    required this.seatNumber,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.navy, AppColors.primaryBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${trajet['ville_depart']} → ${trajet['ville_arrivee']}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  '${trajet['compagnie']} · Siège $seatNumber',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${trajet['prix']}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  height: 1.1,
                ),
              ),
              Text(
                'CFA',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.8),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// Booking Details Card
class _BookingDetailsCard extends StatelessWidget {
  final Map<String, dynamic> trajet;
  final String seatNumber;

  const _BookingDetailsCard({
    required this.trajet,
    required this.seatNumber,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
        border: Border.all(color: AppColors.borderGrey),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Détails',
            style: TextStyle(
              color: AppColors.navy,
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          _DetailRow(
            icon: Icons.business_rounded,
            label: 'Compagnie',
            value: trajet['compagnie']?.toString() ?? '—',
          ),
          _DetailRow(
            icon: Icons.directions_bus_rounded,
            label: 'Bus',
            value:
                '${trajet['bus']} (${trajet['type_bus']})',
          ),
          _DetailRow(
            icon: Icons.event_seat_rounded,
            label: 'Siège',
            value: seatNumber,
          ),
        ],
      ),
    );
  }
}

// Detail Row Helper
class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primaryBlue),
          const SizedBox(width: AppSpacing.lg),
          SizedBox(
            width: 88,
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textGrey,
                fontSize: 13,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: AppColors.navy,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
