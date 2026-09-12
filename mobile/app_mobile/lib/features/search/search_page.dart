import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/network/api_client.dart';
import '../../core/services/client_service.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../shared/components/index.dart';
import 'trajet_detail_page.dart';

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
      setState(() => _trajets = list);
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _trajets = [];
      });
      if (mounted) {
        AppErrorSnackbar.show(context, message: _error!);
      }
    } catch (e) {
      setState(() {
        _error = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
        _trajets = [];
      });
      if (mounted) {
        AppErrorSnackbar.show(context, message: _error!);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _clearDate() => setState(() => _date = null);

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

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Search Form Card
        Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                children: [
                  // Departure City Picker
                  CityPickerField(
                    label: 'Ville de départ',
                    value: _departCtrl.text.isEmpty ? null : _departCtrl.text,
                    cities: _villes,
                    onCitySelected: (city) {
                      setState(() => _departCtrl.text = city);
                    },
                  ),
                  const SizedBox(height: AppSpacing.lg),

                  // Arrival City Picker
                  CityPickerField(
                    label: 'Ville d\'arrivée',
                    value: _arriveeCtrl.text.isEmpty ? null : _arriveeCtrl.text,
                    cities: _villes,
                    onCitySelected: (city) {
                      setState(() => _arriveeCtrl.text = city);
                    },
                  ),
                  const SizedBox(height: AppSpacing.lg),

                  // Date Picker
                  DatePickerField(
                    label: 'Date de départ',
                    value: _date,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 90)),
                    onDateSelected: (date) {
                      setState(() => _date = date);
                    },
                  ),
                  if (_date != null) ...[
                    const SizedBox(height: AppSpacing.sm),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: _clearDate,
                        child: const Text(
                          'Effacer la date',
                          style: TextStyle(fontSize: 12),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.lg),

                  // Search Button
                  PrimaryButton(
                    label: 'Rechercher les trajets',
                    isLoading: _loading,
                    onPressed: _search,
                  ),
                ],
              ),
            ),
          ),
        ),

        // Results Section
        Expanded(
          child: _buildResultsSection(),
        ),
      ],
    );
  }

  Widget _buildResultsSection() {
    // Loading state
    if (_loading && _searched) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        child: TripSkeleton(count: 3),
      );
    }

    // Error state
    if (_error != null) {
      return AppErrorWidget(
        message: _error!,
        title: 'Erreur de recherche',
        onRetry: _search,
      );
    }

    // No search performed yet
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

    // No results
    if (_trajets.isEmpty) {
      return NoResultsEmpty(
        onRetry: _search,
      );
    }

    // Results list
    return ListView.separated(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.lg,
      ),
      itemCount: _trajets.length,
      separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.lg),
      itemBuilder: (_, index) {
        final trajet = _trajets[index];
        return _TripCardWidget(
          trajet: trajet,
          onTap: () => _selectTrip(trajet),
        );
      },
    );
  }
}

/// Custom TripCard widget to match the API structure
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
    final badgeColor =
        places > 0 ? AppColors.success.withValues(alpha: 0.1) : AppColors.errorRed.withValues(alpha: 0.1);

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
        badgeLabel: badgeLabel,
        badgeColor: badgeColor,
        isBooked: false,
      ),
    );
  }
}
