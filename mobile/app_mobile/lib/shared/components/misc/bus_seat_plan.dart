import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// Plan de bus type 2+allée+2, avec zone conducteur en tête.
class BusSeatPlan extends StatelessWidget {
  final List<Map<String, dynamic>> seats;
  final int? selectedId;
  final ValueChanged<Map<String, dynamic>>? onSelect;
  final bool selectableOnlyLibre;

  const BusSeatPlan({
    super.key,
    required this.seats,
    this.selectedId,
    this.onSelect,
    this.selectableOnlyLibre = true,
  });

  static bool isLibre(Map<String, dynamic> s) =>
      (s['etat']?.toString() ?? '') == 'disponible';

  static bool isOccupe(Map<String, dynamic> s) {
    final etat = s['etat']?.toString() ?? '';
    return etat == 'occupe' || etat == 'paye' || etat == 'en_attente';
  }

  @override
  Widget build(BuildContext context) {
    if (seats.isEmpty) {
      return const Center(
        child: Text('Aucun siège trouvé.', style: TextStyle(color: AppColors.textGrey)),
      );
    }

    final rows = <List<Map<String, dynamic>>>[];
    for (var i = 0; i < seats.length; i += 4) {
      rows.add(seats.sublist(i, i + 4 > seats.length ? seats.length : i + 4));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 340),
          child: Container(
            padding: const EdgeInsets.fromLTRB(14, 14, 14, 18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.borderGrey),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                // Avant du bus / conducteur
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.airline_seat_recline_extra_rounded, size: 18, color: AppColors.textGrey),
                      SizedBox(width: 6),
                      Text(
                        'Avant · Conducteur',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textGrey,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Allée centrale',
                  style: TextStyle(fontSize: 10, color: AppColors.textGrey),
                ),
                const SizedBox(height: 10),
                ...rows.asMap().entries.map((entry) {
                  final row = entry.value;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Row(
                            children: [
                              _seatOrEmpty(row, 0),
                              const SizedBox(width: 8),
                              _seatOrEmpty(row, 1),
                            ],
                          ),
                        ),
                        // Allée
                        SizedBox(
                          width: 28,
                          child: Column(
                            children: [
                              Container(
                                width: 2,
                                height: 36,
                                color: const Color(0xFFE2E8F0),
                              ),
                            ],
                          ),
                        ),
                        Expanded(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              _seatOrEmpty(row, 2),
                              const SizedBox(width: 8),
                              _seatOrEmpty(row, 3),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 4),
                const Text(
                  'Arrière',
                  style: TextStyle(fontSize: 10, color: AppColors.textGrey),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _seatOrEmpty(List<Map<String, dynamic>> row, int index) {
    if (index >= row.length) {
      return const SizedBox(width: 48, height: 48);
    }
    return _SeatTile(
      seat: row[index],
      selected: row[index]['id'] == selectedId,
      onSelect: onSelect,
      selectableOnlyLibre: selectableOnlyLibre,
    );
  }
}

class _SeatTile extends StatelessWidget {
  final Map<String, dynamic> seat;
  final bool selected;
  final ValueChanged<Map<String, dynamic>>? onSelect;
  final bool selectableOnlyLibre;

  const _SeatTile({
    required this.seat,
    required this.selected,
    this.onSelect,
    this.selectableOnlyLibre = true,
  });

  @override
  Widget build(BuildContext context) {
    final libre = BusSeatPlan.isLibre(seat);
    final occupe = BusSeatPlan.isOccupe(seat);
    final clickable = onSelect != null && (!selectableOnlyLibre || libre);

    Color border;
    Color fill;
    Color text;
    if (selected) {
      border = AppColors.primaryBlue;
      fill = AppColors.primaryBlue.withValues(alpha: 0.18);
      text = AppColors.primaryBlue;
    } else if (occupe) {
      border = const Color(0xFFDC2626);
      fill = const Color(0xFFDC2626).withValues(alpha: 0.12);
      text = const Color(0xFFDC2626);
    } else {
      border = const Color(0xFF16A34A);
      fill = const Color(0xFF16A34A).withValues(alpha: 0.12);
      text = const Color(0xFF16A34A);
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: clickable ? () => onSelect!(seat) : null,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: fill,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: border, width: 2),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                selected
                    ? Icons.event_seat
                    : occupe
                        ? Icons.event_seat
                        : Icons.event_seat_outlined,
                size: 16,
                color: text,
              ),
              Text(
                seat['numero'].toString(),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: text,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
