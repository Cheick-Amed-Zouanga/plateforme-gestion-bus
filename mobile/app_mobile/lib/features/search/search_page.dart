import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/network/api_client.dart';
import '../../core/services/client_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../shared/components/index.dart';
import 'trajet_detail_page.dart';

enum _SortMode { heure, prixAsc, prixDesc }

class SearchPage extends StatefulWidget {
  const SearchPage({super.key});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _departCtrl = TextEditingController();
  final _arriveeCtrl = TextEditingController();
  DateTime? _date;
  List<String> _villes = [];
  List<Map<String, dynamic>> _trajets = [];
  bool _loading = false;
  bool _searched = false;
  String? _error;

  // Filtres prix / tri (appliqués côté client sur les résultats)
  RangeValues? _priceRange;
  double _priceMin = 0;
  double _priceMax = 10000;
  _SortMode _sortMode = _SortMode.heure;
  bool _showPriceFilter = false;

  @override
  void initState() {
    super.initState();
    _loadVilles();
  }

  @override
  void dispose() {
    _departCtrl.dispose();
    _arriveeCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadVilles() async {
    try {
      final villes = await ClientService.instance.fetchVilles();
      if (mounted) setState(() => _villes = villes);
    } catch (_) {
      // Erreur au chargement des villes
    }
  }

  int _prixOf(Map<String, dynamic> t) {
    final p = t['prix'];
    if (p is num) return p.round();
    return int.tryParse(p?.toString() ?? '') ?? 0;
  }

  void _initPriceBounds(List<Map<String, dynamic>> list) {
    if (list.isEmpty) {
      _priceMin = 0;
      _priceMax = 10000;
      _priceRange = null;
      return;
    }
    final prices = list.map(_prixOf).toList()..sort();
    _priceMin = prices.first.toDouble();
    _priceMax = prices.last.toDouble();
    if (_priceMax <= _priceMin) {
      _priceMax = _priceMin + 500;
    }
    // Arrondi propre en paliers de 100
    _priceMin = (_priceMin / 100).floor() * 100.0;
    _priceMax = (_priceMax / 100).ceil() * 100.0;
    if (_priceMax <= _priceMin) _priceMax = _priceMin + 500;
    _priceRange = RangeValues(_priceMin, _priceMax);
  }

  List<Map<String, dynamic>> get _filteredTrajets {
    var list = List<Map<String, dynamic>>.from(_trajets);
    final range = _priceRange;
    if (range != null) {
      list = list.where((t) {
        final p = _prixOf(t).toDouble();
        return p >= range.start && p <= range.end;
      }).toList();
    }

    switch (_sortMode) {
      case _SortMode.prixAsc:
        list.sort((a, b) => _prixOf(a).compareTo(_prixOf(b)));
      case _SortMode.prixDesc:
        list.sort((a, b) => _prixOf(b).compareTo(_prixOf(a)));
      case _SortMode.heure:
        list.sort((a, b) {
          final da = DateTime.tryParse(a['depart_prevu']?.toString() ?? '') ??
              DateTime(2099);
          final db = DateTime.tryParse(b['depart_prevu']?.toString() ?? '') ??
              DateTime(2099);
          return da.compareTo(db);
        });
    }
    return list;
  }

  bool get _priceFilterActive {
    final range = _priceRange;
    if (range == null) return false;
    return range.start > _priceMin + 0.5 || range.end < _priceMax - 0.5;
  }

  Future<void> _search() async {
    final depart = _departCtrl.text.trim();
    final arrivee = _arriveeCtrl.text.trim();

    if (depart.isEmpty || arrivee.isEmpty) {
      AppWarningSnackbar.show(
        context,
        message: 'Veuillez indiquer la ville de départ et d\'arrivée',
      );
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
      _searched = true;
      _showPriceFilter = false;
    });

    try {
      final dateStr =
          _date != null ? DateFormat('yyyy-MM-dd').format(_date!) : null;
      final list = await ClientService.instance.searchTrajets(
        depart: depart,
        arrivee: arrivee,
        date: dateStr,
      );
      if (!mounted) return;
      setState(() {
        _trajets = list;
        _initPriceBounds(list);
        _sortMode = _SortMode.heure;
      });
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _trajets = [];
        _priceRange = null;
      });
      if (mounted) {
        AppErrorSnackbar.show(context, message: _error!);
      }
    } catch (e) {
      setState(() {
        _error = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
        _trajets = [];
        _priceRange = null;
      });
      if (mounted) {
        AppErrorSnackbar.show(context, message: _error!);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _clearDate() => setState(() => _date = null);

  void _swapCities() {
    final tmp = _departCtrl.text;
    setState(() {
      _departCtrl.text = _arriveeCtrl.text;
      _arriveeCtrl.text = tmp;
    });
  }

  void _resetPriceFilter() {
    setState(() {
      _priceRange = RangeValues(_priceMin, _priceMax);
    });
  }

  void _selectTrip(Map<String, dynamic> trajet) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => TrajetDetailPage(
          trajetSummary: trajet,
          villeDepart: _departCtrl.text.trim(),
          villeArrivee: _arriveeCtrl.text.trim(),
        ),
      ),
    );
  }

  String _fmtPrice(double v) {
    final n = v.round();
    if (n >= 1000) {
      final k = (n / 1000).toStringAsFixed(n % 1000 == 0 ? 0 : 1);
      return '${k}k';
    }
    return '$n';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.md,
            AppSpacing.lg,
            AppSpacing.sm,
          ),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: CityPickerField(
                          label: 'De',
                          compact: true,
                          prefixIconData: Icons.trip_origin_rounded,
                          value:
                              _departCtrl.text.isEmpty ? null : _departCtrl.text,
                          cities: _villes,
                          onCitySelected: (city) {
                            setState(() => _departCtrl.text = city);
                          },
                        ),
                      ),
                      Padding(
                        padding:
                            const EdgeInsets.only(top: 10, left: 4, right: 4),
                        child: IconButton(
                          onPressed: _swapCities,
                          tooltip: 'Inverser',
                          visualDensity: VisualDensity.compact,
                          style: IconButton.styleFrom(
                            backgroundColor: AppColors.surfaceMuted,
                            foregroundColor: AppColors.primaryBlue,
                            minimumSize: const Size(36, 36),
                            padding: EdgeInsets.zero,
                          ),
                          icon: const Icon(Icons.swap_horiz_rounded, size: 20),
                        ),
                      ),
                      Expanded(
                        child: CityPickerField(
                          label: 'À',
                          compact: true,
                          prefixIconData: Icons.location_on_rounded,
                          value: _arriveeCtrl.text.isEmpty
                              ? null
                              : _arriveeCtrl.text,
                          cities: _villes,
                          onCitySelected: (city) {
                            setState(() => _arriveeCtrl.text = city);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: [
                      Expanded(
                        child: DatePickerField(
                          label: 'Date',
                          value: _date,
                          firstDate: DateTime.now(),
                          lastDate:
                              DateTime.now().add(const Duration(days: 90)),
                          onDateSelected: (date) {
                            setState(() => _date = date);
                          },
                        ),
                      ),
                      if (_date != null) ...[
                        const SizedBox(width: 4),
                        IconButton(
                          onPressed: _clearDate,
                          tooltip: 'Effacer la date',
                          visualDensity: VisualDensity.compact,
                          icon: const Icon(Icons.close_rounded, size: 18),
                          color: AppColors.textGrey,
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  PrimaryButton(
                    label: 'Rechercher',
                    isLoading: _loading,
                    onPressed: _search,
                  ),
                ],
              ),
            ),
          ),
        ),

        if (_searched && !_loading && _trajets.isNotEmpty) _buildFilterBar(),

        Expanded(child: _buildResultsSection()),
      ],
    );
  }

  Widget _buildFilterBar() {
    final filtered = _filteredTrajets;
    final range = _priceRange ?? RangeValues(_priceMin, _priceMax);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        0,
        AppSpacing.lg,
        AppSpacing.sm,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                '${filtered.length} résultat${filtered.length > 1 ? 's' : ''}',
                style: const TextStyle(
                  color: AppColors.textGrey,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              _SortChip(
                label: 'Heure',
                selected: _sortMode == _SortMode.heure,
                onTap: () => setState(() => _sortMode = _SortMode.heure),
              ),
              const SizedBox(width: 6),
              _SortChip(
                label: 'Prix ↑',
                selected: _sortMode == _SortMode.prixAsc,
                onTap: () => setState(() => _sortMode = _SortMode.prixAsc),
              ),
              const SizedBox(width: 6),
              _SortChip(
                label: 'Prix ↓',
                selected: _sortMode == _SortMode.prixDesc,
                onTap: () => setState(() => _sortMode = _SortMode.prixDesc),
              ),
              const SizedBox(width: 4),
              IconButton(
                tooltip: 'Filtrer par prix',
                onPressed: () =>
                    setState(() => _showPriceFilter = !_showPriceFilter),
                visualDensity: VisualDensity.compact,
                style: IconButton.styleFrom(
                  backgroundColor: _priceFilterActive || _showPriceFilter
                      ? AppColors.primaryBlue.withValues(alpha: 0.18)
                      : AppColors.surfaceMuted,
                  foregroundColor: _priceFilterActive || _showPriceFilter
                      ? AppColors.primaryBlue
                      : AppColors.textGrey,
                  minimumSize: const Size(34, 34),
                  padding: EdgeInsets.zero,
                ),
                icon: Badge(
                  isLabelVisible: _priceFilterActive,
                  smallSize: 8,
                  backgroundColor: AppColors.primaryBlue,
                  child: const Icon(Icons.tune_rounded, size: 18),
                ),
              ),
            ],
          ),
          if (_showPriceFilter) ...[
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
                border: Border.all(color: AppColors.borderGrey),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.payments_outlined,
                        size: 16,
                        color: AppColors.primaryBlue,
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'Prix',
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${_fmtPrice(range.start)} – ${_fmtPrice(range.end)} CFA',
                        style: const TextStyle(
                          color: AppColors.primaryBlue,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      if (_priceFilterActive) ...[
                        const SizedBox(width: 4),
                        TextButton(
                          onPressed: _resetPriceFilter,
                          style: TextButton.styleFrom(
                            visualDensity: VisualDensity.compact,
                            padding: const EdgeInsets.symmetric(horizontal: 6),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text(
                            'Reset',
                            style: TextStyle(fontSize: 11),
                          ),
                        ),
                      ],
                    ],
                  ),
                  RangeSlider(
                    values: range,
                    min: _priceMin,
                    max: _priceMax,
                    divisions: ((_priceMax - _priceMin) / 100)
                        .round()
                        .clamp(1, 50),
                    labels: RangeLabels(
                      '${range.start.round()}',
                      '${range.end.round()}',
                    ),
                    activeColor: AppColors.primaryBlue,
                    inactiveColor: AppColors.borderGrey,
                    onChanged: (v) => setState(() => _priceRange = v),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildResultsSection() {
    if (_loading && _searched) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        child: TripSkeleton(count: 3),
      );
    }

    if (_error != null) {
      return AppErrorWidget(
        message: _error!,
        title: 'Erreur de recherche',
        onRetry: _search,
      );
    }

    if (!_searched) {
      return const SizedBox.expand(
        child: Center(
          child: Text(
            'Utilisez le formulaire ci-dessus\npour rechercher des trajets',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textGrey,
              fontSize: 14,
            ),
          ),
        ),
      );
    }

    if (_trajets.isEmpty) {
      return NoResultsEmpty(onRetry: _search);
    }

    final filtered = _filteredTrajets;
    if (filtered.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.filter_alt_off_rounded,
                size: 40,
                color: AppColors.textLight,
              ),
              const SizedBox(height: AppSpacing.md),
              const Text(
                'Aucun trajet dans cette fourchette de prix',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textGrey, fontSize: 14),
              ),
              const SizedBox(height: AppSpacing.sm),
              TextButton(
                onPressed: _resetPriceFilter,
                child: const Text('Réinitialiser le filtre prix'),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.lg,
        AppSpacing.lg,
      ),
      itemCount: filtered.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
      itemBuilder: (_, index) {
        final trajet = filtered[index];
        return _TripCardWidget(
          trajet: trajet,
          onTap: () => _selectTrip(trajet),
        );
      },
    );
  }
}

class _SortChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _SortChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? AppColors.primaryBlue.withValues(alpha: 0.18)
          : AppColors.surfaceMuted,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? AppColors.primaryBlue : AppColors.borderGrey,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: selected ? AppColors.primaryBlue : AppColors.textGrey,
            ),
          ),
        ),
      ),
    );
  }
}

class _TripCardWidget extends StatelessWidget {
  final Map<String, dynamic> trajet;
  final VoidCallback onTap;

  const _TripCardWidget({
    required this.trajet,
    required this.onTap,
  });

  String _getTrajetDuration() {
    try {
      final depart =
          DateTime.tryParse(trajet['depart_prevu']?.toString() ?? '');
      final arrivee =
          DateTime.tryParse(trajet['arrivee_prevue']?.toString() ?? '');

      if (depart == null || arrivee == null) return '—';

      final duration = arrivee.difference(depart);
      final hours = duration.inHours;
      final minutes = duration.inMinutes % 60;

      if (hours == 0) return '${minutes}min';
      return '${hours}h ${minutes}min';
    } catch (_) {
      return '—';
    }
  }

  String _getDepartureTime() {
    try {
      final depart =
          DateTime.tryParse(trajet['depart_prevu']?.toString() ?? '');
      if (depart == null) return '—';
      return DateFormat('HH:mm').format(depart.toLocal());
    } catch (_) {
      return '—';
    }
  }

  String _getArrivalTime() {
    try {
      final arrivee =
          DateTime.tryParse(trajet['arrivee_prevue']?.toString() ?? '');
      if (arrivee == null) return '—';
      return DateFormat('HH:mm').format(arrivee.toLocal());
    } catch (_) {
      return '—';
    }
  }

  @override
  Widget build(BuildContext context) {
    final price = (trajet['prix'] ?? 0).toString();
    final places = (trajet['places_disponibles'] ?? 0) as int;
    final badgeLabel = places > 0 ? 'Disponible' : 'Complet';
    final badgeColor = places > 0 ? AppColors.success : AppColors.errorRed;

    return GestureDetector(
      onTap: onTap,
      child: TripCard(
        departure: trajet['ville_depart'] ?? '—',
        departureTime: _getDepartureTime(),
        arrival: trajet['ville_arrivee'] ?? '—',
        arrivalTime: _getArrivalTime(),
        duration: _getTrajetDuration(),
        price: '$price CFA',
        busCompany: trajet['compagnie'] ?? 'Bus',
        logoUrl: resolveMediaUrl(trajet['logo_compagnie']?.toString()),
        badgeLabel: badgeLabel,
        badgeColor: badgeColor,
        isBooked: false,
      ),
    );
  }
}
