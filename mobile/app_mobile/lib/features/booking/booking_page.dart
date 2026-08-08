import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import '../../core/services/client_service.dart';
import '../../core/theme/app_theme.dart';
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

/// Page pleine (fallback) — la confirmation s’ouvre plutôt via [showBookingSheet].
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
      padding: EdgeInsets.fromLTRB(20, 0, 20, 16 + bottom),
      children: [
        if (!widget.embedded) ...[
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 14),
              decoration: BoxDecoration(
                color: AppColors.borderGrey,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
        ],
        Row(
          children: [
            const Expanded(
              child: Text(
                'Confirmer la commande',
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
                icon: const Icon(Icons.close_rounded, color: AppColors.textGrey),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.navy, AppColors.primaryBlue],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${t['ville_depart']} → ${t['ville_arrivee']}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${t['compagnie']} · Siège ${widget.siegeNumero}',
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
                    '${t['prix']}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      height: 1.1,
                    ),
                  ),
                  Text(
                    'XOF',
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
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.borderGrey),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Récapitulatif',
                style: TextStyle(
                  color: AppColors.navy,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),
              _row(Icons.business_rounded, 'Compagnie', t['compagnie']?.toString() ?? ''),
              _row(Icons.directions_bus_rounded, 'Bus', '${t['bus']} (${t['type_bus']})'),
              _row(Icons.event_seat_rounded, 'Siège', widget.siegeNumero),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Mode de paiement (au guichet)',
          style: TextStyle(
            color: AppColors.navy,
            fontSize: 15,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        ..._paymentOptions(),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.tealSoft,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFB8EFE0)),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline_rounded, color: AppColors.teal, size: 20),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Votre billet sera émis immédiatement. Le paiement reste en attente jusqu’à confirmation au guichet.',
                  style: TextStyle(
                    color: AppColors.textBody,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEE2E2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _error!,
              style: const TextStyle(color: AppColors.errorRed, fontSize: 13),
            ),
          ),
        ],
        const SizedBox(height: 18),
        ElevatedButton(
          onPressed: _loading ? null : _confirm,
          child: _loading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Text('Confirmer et obtenir mon billet'),
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
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
        padding: const EdgeInsets.only(bottom: 8),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => setState(() => _mode = m.$1),
            borderRadius: BorderRadius.circular(14),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: selected ? const Color(0xFFEEF0FF) : AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: selected ? AppColors.primaryBlue : AppColors.borderGrey,
                  width: selected ? 1.8 : 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    m.$3,
                    color: selected ? AppColors.primaryBlue : AppColors.textGrey,
                    size: 22,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      m.$2,
                      style: TextStyle(
                        color: AppColors.navy,
                        fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                      ),
                    ),
                  ),
                  Icon(
                    selected ? Icons.check_circle_rounded : Icons.circle_outlined,
                    color: selected ? AppColors.primaryBlue : AppColors.borderGrey,
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

  Widget _row(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primaryBlue),
          const SizedBox(width: 10),
          SizedBox(
            width: 88,
            child: Text(
              label,
              style: const TextStyle(color: AppColors.textGrey, fontSize: 13),
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
