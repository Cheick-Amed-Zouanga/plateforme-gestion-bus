import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/network/api_client.dart';
import '../../core/services/client_service.dart';
import '../../core/theme/app_theme.dart';

class TicketDetailPage extends StatefulWidget {
  final String numero;
  final Map<String, dynamic>? initialData;

  const TicketDetailPage({
    super.key,
    required this.numero,
    this.initialData,
  });

  @override
  State<TicketDetailPage> createState() => _TicketDetailPageState();
}

class _TicketDetailPageState extends State<TicketDetailPage> {
  Map<String, dynamic>? _billet;
  String? _qrImage;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      _billet = Map<String, dynamic>.from(
        (widget.initialData!['billet'] as Map?) ?? widget.initialData!,
      );
      _qrImage = widget.initialData!['qr_image'] as String?;
      _loading = false;
      if (_billet?['numero_billet'] == null) {
        _load();
      }
    } else {
      _load();
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ClientService.instance.billetDetail(widget.numero);
      if (!mounted) return;
      setState(() {
        _billet = Map<String, dynamic>.from(data['billet'] as Map);
        _qrImage = data['qr_image'] as String?;
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      setState(() {
        _error = 'Impossible de charger le billet.';
        _loading = false;
      });
    }
  }

  Widget _qrWidget(String numero) {
    if (_qrImage != null && _qrImage!.startsWith('data:image')) {
      try {
        final b64 = _qrImage!.split(',').last;
        return Image.memory(base64Decode(b64), width: 200, height: 200);
      } catch (_) {}
    }
    return QrImageView(
      data: numero,
      size: 200,
      backgroundColor: Colors.white,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon billet'),
        leading: IconButton(
          icon: const Icon(Icons.home),
          onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/home', (_) => false),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _buildTicket(),
    );
  }

  Widget _buildTicket() {
    final b = _billet!;
    final numero = b['numero_billet']?.toString() ?? widget.numero;
    final depart = DateTime.tryParse(b['depart_prevu']?.toString() ?? '');
    final date = depart != null
        ? DateFormat('dd/MM/yyyy HH:mm').format(depart.toLocal())
        : '—';

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.borderGrey),
          ),
          child: Column(
            children: [
              const Text(
                'TERRASO',
                style: TextStyle(
                  letterSpacing: 3,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryBlue,
                  fontSize: 20,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                numero,
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.headerDark,
                ),
              ),
              const SizedBox(height: 16),
              _qrWidget(numero),
              const SizedBox(height: 16),
              Text(
                b['nom_compagnie']?.toString() ?? '',
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
              ),
              Text(
                '${b['arret_depart_ville']} → ${b['arret_arrivee_ville']}',
                style: const TextStyle(fontSize: 15),
              ),
              const SizedBox(height: 8),
              Text(date, style: const TextStyle(color: AppColors.textGrey)),
              Text('Siège ${b['siege_numero'] ?? '—'} · Bus ${b['bus_display'] ?? ''}'),
              const SizedBox(height: 12),
              Text(
                '${b['prix']} ${b['devise'] ?? 'XOF'}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Chip(
                label: Text(
                  b['statut_paiement_display']?.toString() ??
                      b['statut_paiement']?.toString() ??
                      'En attente',
                ),
                backgroundColor: Colors.orange.shade100,
              ),
              const SizedBox(height: 8),
              Text(
                'Passager : ${b['passager'] ?? ''}',
                style: const TextStyle(color: AppColors.textGrey),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Présentez ce QR code au contrôleur. Réglez le paiement au guichet si le statut est « En attente ».',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textGrey, height: 1.4),
        ),
        const SizedBox(height: 20),
        OutlinedButton(
          onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/home', (_) => false),
          child: const Text('Retour à l\'accueil'),
        ),
      ],
    );
  }
}
