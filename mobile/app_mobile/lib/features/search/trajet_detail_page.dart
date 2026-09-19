import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/network/api_client.dart';
import '../../core/services/client_service.dart';
import '../../core/storage/session_storage.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/components/misc/bus_seat_plan.dart';
import '../auth/login_page.dart';
import '../booking/booking_page.dart';

class TrajetDetailPage extends StatefulWidget {
  final Map<String, dynamic> trajetSummary;
  final String villeDepart;
  final String villeArrivee;

  const TrajetDetailPage({
    super.key,
    required this.trajetSummary,
    required this.villeDepart,
    required this.villeArrivee,
  });

  @override
  State<TrajetDetailPage> createState() => _TrajetDetailPageState();
}

class _TrajetDetailPageState extends State<TrajetDetailPage> {
  Map<String, dynamic>? _plan;
  bool _loading = true;
  String? _error;
  int? _selectedSiegeId;
  String? _selectedSiegeNumero;

  int get _trajetId => widget.trajetSummary['id'] as int;
  int get _arretDep => widget.trajetSummary['arret_depart_id'] as int;
  int get _arretArr => widget.trajetSummary['arret_arrivee_id'] as int;

  List<Map<String, dynamic>> get _seats {
    final list = (_plan?['plan'] as List?) ?? [];
    return list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  @override
  void initState() {
    super.initState();
    _loadPlan();
  }

  Future<void> _loadPlan() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final plan = await ClientService.instance.planBus(
        trajetId: _trajetId,
        arretDepart: _arretDep,
        arretArrivee: _arretArr,
      );
      if (!mounted) return;
      setState(() {
        _plan = plan;
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      setState(() {
        _error = 'Impossible de charger le plan de bus.';
        _loading = false;
      });
    }
  }

  Future<void> _commander() async {
    if (_selectedSiegeId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sélectionnez un siège.')),
      );
      return;
    }

    final auth = await SessionStorage.instance.isAuthenticated();
    if (!auth) {
      if (!mounted) return;
      final ok = await Navigator.push<bool>(
        context,
        MaterialPageRoute(builder: (_) => const LoginPage(popOnSuccess: true)),
      );
      final auth2 = await SessionStorage.instance.isAuthenticated();
      if (!auth2) {
        if (!mounted) return;
        if (ok != true) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Connexion requise pour commander.')),
          );
        }
        return;
      }
    }

    if (!mounted) return;
    await showBookingSheet(
      context,
      trajet: widget.trajetSummary,
      siegeId: _selectedSiegeId!,
      siegeNumero: _selectedSiegeNumero ?? '?',
      arretDepart: _arretDep,
      arretArrivee: _arretArr,
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = widget.trajetSummary;
    final depart = DateTime.tryParse(t['depart_prevu']?.toString() ?? '');
    final heure = depart != null
        ? DateFormat("dd/MM/yyyy 'à' HH:mm").format(depart.toLocal())
        : '—';

    return Scaffold(
      appBar: AppBar(title: const Text('Détail trajet')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : Column(
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      color: Colors.white,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t['compagnie']?.toString() ?? '',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                              color: AppColors.primaryBlue,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text('${t['ville_depart']} → ${t['ville_arrivee']}'),
                          Text(heure, style: const TextStyle(color: AppColors.textGrey)),
                          Text(
                            '${t['prix']} XOF · Bus ${t['type_bus']} · ${t['bus']}',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.fromLTRB(16, 12, 16, 8),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Choisissez votre siège',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        children: [
                          _legend(const Color(0xFF16A34A), 'Libre'),
                          const SizedBox(width: 12),
                          _legend(const Color(0xFFDC2626), 'Occupé'),
                          const SizedBox(width: 12),
                          _legend(AppColors.primaryBlue, 'Sélectionné'),
                        ],
                      ),
                    ),
                    Expanded(
                      child: BusSeatPlan(
                        seats: _seats,
                        selectedId: _selectedSiegeId,
                        onSelect: (s) {
                          setState(() {
                            _selectedSiegeId = s['id'] as int;
                            _selectedSiegeNumero = s['numero'].toString();
                          });
                        },
                      ),
                    ),
                    SafeArea(
                      top: false,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: ElevatedButton(
                          onPressed: _commander,
                          child: Text(
                            _selectedSiegeNumero == null
                                ? 'Commander'
                                : 'Commander · Siège $_selectedSiegeNumero',
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _legend(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3)),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}
