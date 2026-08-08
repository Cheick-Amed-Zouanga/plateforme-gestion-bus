import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/network/api_client.dart';
import '../../core/services/client_service.dart';
import '../../core/theme/app_theme.dart';
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
    } catch (_) {}
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date ?? now,
      firstDate: now,
      lastDate: now.add(const Duration(days: 90)),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<String?> _pickVille(String title, TextEditingController ctrl) async {
    if (_villes.isEmpty) return null;
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        final filter = TextEditingController();
        var filtered = List<String>.from(_villes);
        return StatefulBuilder(
          builder: (ctx, setModal) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
              ),
              child: SizedBox(
                height: MediaQuery.of(ctx).size.height * 0.6,
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: TextField(
                        controller: filter,
                        decoration: InputDecoration(
                          labelText: title,
                          prefixIcon: const Icon(Icons.search),
                        ),
                        onChanged: (v) {
                          setModal(() {
                            filtered = _villes
                                .where((e) => e.toLowerCase().contains(v.toLowerCase()))
                                .toList();
                          });
                        },
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        itemCount: filtered.length,
                        itemBuilder: (_, i) => ListTile(
                          title: Text(filtered[i]),
                          onTap: () {
                            ctrl.text = filtered[i];
                            Navigator.pop(ctx, filtered[i]);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _search() async {
    final depart = _departCtrl.text.trim();
    final arrivee = _arriveeCtrl.text.trim();
    if (depart.isEmpty || arrivee.isEmpty) {
      setState(() => _error = 'Indiquez départ et arrivée.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _searched = true;
    });
    try {
      final dateStr = _date != null ? DateFormat('yyyy-MM-dd').format(_date!) : null;
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
    } catch (_) {
      setState(() {
        _error = 'Impossible de joindre le serveur.';
        _trajets = [];
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateLabel = _date == null
        ? 'Toutes dates'
        : DateFormat('dd/MM/yyyy').format(_date!);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Rechercher un trajet',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppColors.headerDark,
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _departCtrl,
          readOnly: _villes.isNotEmpty,
          onTap: _villes.isEmpty ? null : () => _pickVille('Ville de départ', _departCtrl),
          decoration: const InputDecoration(
            labelText: 'Départ',
            prefixIcon: Icon(Icons.trip_origin),
          ),
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: _arriveeCtrl,
          readOnly: _villes.isNotEmpty,
          onTap: _villes.isEmpty ? null : () => _pickVille('Ville d\'arrivée', _arriveeCtrl),
          decoration: const InputDecoration(
            labelText: 'Arrivée',
            prefixIcon: Icon(Icons.location_on_outlined),
          ),
        ),
        const SizedBox(height: 12),
        InkWell(
          onTap: _pickDate,
          child: InputDecorator(
            decoration: const InputDecoration(
              labelText: 'Date',
              prefixIcon: Icon(Icons.calendar_today_outlined),
            ),
            child: Text(dateLabel),
          ),
        ),
        if (_date != null)
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: () => setState(() => _date = null),
              child: const Text('Effacer la date'),
            ),
          ),
        const SizedBox(height: 8),
        ElevatedButton(
          onPressed: _loading ? null : _search,
          child: _loading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Text('Rechercher'),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: AppColors.errorRed)),
        ],
        const SizedBox(height: 20),
        if (_searched && !_loading && _trajets.isEmpty && _error == null)
          const Text(
            'Aucun trajet trouvé pour ces critères.',
            style: TextStyle(color: AppColors.textGrey),
          ),
        ..._trajets.map((t) => _TrajetCard(
              trajet: t,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => TrajetDetailPage(
                      trajetSummary: t,
                      villeDepart: _departCtrl.text.trim(),
                      villeArrivee: _arriveeCtrl.text.trim(),
                    ),
                  ),
                );
              },
            )),
      ],
    );
  }
}

class _TrajetCard extends StatelessWidget {
  final Map<String, dynamic> trajet;
  final VoidCallback onTap;

  const _TrajetCard({required this.trajet, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final depart = DateTime.tryParse(trajet['depart_prevu']?.toString() ?? '');
    final heure = depart != null ? DateFormat('HH:mm').format(depart.toLocal()) : '—';
    final date = depart != null ? DateFormat('dd/MM').format(depart.toLocal()) : '';
    final prix = trajet['prix'] ?? 0;
    final places = trajet['places_disponibles'] ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      trajet['compagnie']?.toString() ?? '',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: AppColors.primaryBlue,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.backgroundGrey,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      trajet['type_bus']?.toString() ?? '',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '${trajet['ville_depart']} → ${trajet['ville_arrivee']}',
                style: const TextStyle(fontSize: 15),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.schedule, size: 16, color: Colors.grey.shade600),
                  const SizedBox(width: 4),
                  Text('$date · $heure'),
                  const Spacer(),
                  Text(
                    '$prix XOF',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.headerDark,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                '$places place(s) disponible(s)',
                style: TextStyle(
                  fontSize: 13,
                  color: places > 0 ? Colors.green.shade700 : AppColors.errorRed,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
