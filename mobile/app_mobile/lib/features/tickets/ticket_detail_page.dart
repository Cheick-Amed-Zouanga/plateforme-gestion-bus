import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/network/api_client.dart';
import '../../core/services/client_service.dart';
import '../../core/theme/app_theme.dart';

/// Couleurs du voucher style billet papier.
class _Voucher {
  static const gold = Color(0xFFC9A227);
  static const goldDeep = Color(0xFFA8841A);
  static const paper = Color(0xFFFFFBF2);
  static const ink = Color(0xFF1A1A1A);
  static const muted = Color(0xFF5C5C5C);
  static const line = Color(0xFFD9CFAF);
}

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

  String? _resolveMediaUrl(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    var url = raw;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      final origin = kApiBaseUrl.replaceFirst(RegExp(r'/api/?$'), '');
      url = url.startsWith('/') ? '$origin$url' : '$origin/$url';
    }
    // Émulateur Android : le host absolu Django (127.0.0.1) ne marche pas
    return url
        .replaceFirst('http://127.0.0.1:', 'http://10.0.2.2:')
        .replaceFirst('http://localhost:', 'http://10.0.2.2:');
  }

  Widget _qrWidget(String numero, {double size = 140}) {
    if (_qrImage != null && _qrImage!.startsWith('data:image')) {
      try {
        final b64 = _qrImage!.split(',').last;
        return Image.memory(
          base64Decode(b64),
          width: size,
          height: size,
          fit: BoxFit.contain,
        );
      } catch (_) {}
    }
    return QrImageView(
      data: numero,
      size: size,
      backgroundColor: Colors.white,
      eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: _Voucher.ink),
      dataModuleStyle: const QrDataModuleStyle(
        dataModuleShape: QrDataModuleShape.square,
        color: _Voucher.ink,
      ),
    );
  }

  Color _statutColor(String? statut) {
    final s = (statut ?? '').toUpperCase();
    if (s.contains('PAYE') || s.contains('PAYÉ') || s.contains('CONFIRME') || s.contains('CONFIRMÉ')) {
      return const Color(0xFF1B7A4A);
    }
    if (s.contains('ANNUL')) return AppColors.errorRed;
    return _Voucher.goldDeep;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Mon billet'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              Navigator.pushNamedAndRemoveUntil(context, '/home', (_) => false);
            }
          },
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.textGrey)))
              : _buildTicket(),
    );
  }

  Widget _buildTicket() {
    final b = _billet!;
    final numero = b['numero_billet']?.toString() ?? widget.numero;
    final depart = DateTime.tryParse(b['depart_prevu']?.toString() ?? '');
    final dateStr = depart != null
        ? DateFormat('dd.MM.yyyy').format(depart.toLocal())
        : '—';
    final dateLong = depart != null
        ? DateFormat('EEEE d MMMM yyyy', 'fr_FR').format(depart.toLocal())
        : '—';
    final heureStr = depart != null
        ? DateFormat('HH:mm').format(depart.toLocal())
        : '—';
    final statut = b['statut_paiement_display']?.toString() ??
        b['statut_paiement']?.toString() ??
        'En attente';
    final statutColor = _statutColor(statut);
    final villeDep = b['arret_depart_ville']?.toString() ?? '—';
    final villeArr = b['arret_arrivee_ville']?.toString() ?? '—';
    final compagnie = b['nom_compagnie']?.toString() ?? '—';
    final logoUrl = _resolveMediaUrl(b['logo_compagnie']?.toString());
    final passager = b['passager']?.toString() ?? '—';
    final siege = b['siege_numero']?.toString() ?? '—';
    final bus = b['bus_display']?.toString() ?? '—';
    final prix = '${b['prix'] ?? '—'} ${b['devise'] ?? 'XOF'}';

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      children: [
        // Voucher doré façon boarding pass
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 28,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [_Voucher.gold, _Voucher.goldDeep, _Voucher.gold],
              ),
            ),
            padding: const EdgeInsets.all(7),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: ColoredBox(
                color: _Voucher.paper,
                child: Column(
                  children: [
                    IntrinsicHeight(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Bandeau vertical
                          Container(
                            width: 34,
                            color: _Voucher.gold.withValues(alpha: 0.18),
                            child: Center(
                              child: RotatedBox(
                                quarterTurns: 3,
                                child: Text(
                                  'BILLET DE VOYAGE',
                                  style: GoogleFonts.libreBaskerville(
                                    color: _Voucher.goldDeep,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 2.4,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(14, 16, 16, 12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // Logo + compagnie
                                  Row(
                                    children: [
                                      _CompanyLogo(url: logoUrl, name: compagnie),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              compagnie.toUpperCase(),
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: GoogleFonts.libreBaskerville(
                                                color: _Voucher.ink,
                                                fontSize: 14,
                                                fontWeight: FontWeight.w700,
                                                height: 1.2,
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              'via TERRASO',
                                              style: TextStyle(
                                                color: _Voucher.muted,
                                                fontSize: 11,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: statutColor.withValues(alpha: 0.12),
                                          borderRadius: BorderRadius.circular(6),
                                          border: Border.all(color: statutColor.withValues(alpha: 0.35)),
                                        ),
                                        child: Text(
                                          statut,
                                          style: TextStyle(
                                            color: statutColor,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 14),
                                  _GoldRule(),
                                  const SizedBox(height: 10),
                                  Text(
                                    'BILLET BUS',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.libreBaskerville(
                                      color: _Voucher.ink,
                                      fontSize: 26,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  _GoldRule(),
                                  const SizedBox(height: 16),

                                  // Trajet
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _CityCol(
                                          label: 'DÉPART',
                                          city: villeDep,
                                          time: heureStr,
                                        ),
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 6),
                                        child: Column(
                                          children: [
                                            Icon(
                                              Icons.directions_bus_filled_rounded,
                                              color: _Voucher.goldDeep,
                                              size: 22,
                                            ),
                                            const SizedBox(height: 4),
                                            Container(
                                              width: 36,
                                              height: 2,
                                              color: _Voucher.gold,
                                            ),
                                          ],
                                        ),
                                      ),
                                      Expanded(
                                        child: _CityCol(
                                          label: 'ARRIVÉE',
                                          city: villeArr,
                                          alignEnd: true,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 14),
                                  Text(
                                    dateLong,
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      color: _Voucher.muted,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  _GoldRule(),
                                  const SizedBox(height: 12),

                                  // Passager + méta
                                  _InfoRow(label: 'PASSAGER', value: passager),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Expanded(child: _InfoRow(label: 'SIÈGE', value: siege)),
                                      Expanded(child: _InfoRow(label: 'BUS', value: bus)),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Expanded(child: _InfoRow(label: 'DATE', value: dateStr)),
                                      Expanded(child: _InfoRow(label: 'PRIX', value: prix)),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Perforation
                    _TicketPerforation(color: AppColors.background),

                    // Stub QR
                    Padding(
                      padding: const EdgeInsets.fromLTRB(18, 6, 18, 18),
                      child: Column(
                        children: [
                          Text(
                            'PASS BUS',
                            style: GoogleFonts.libreBaskerville(
                              color: _Voucher.ink,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Présentez ce code au contrôle',
                            style: TextStyle(
                              color: _Voucher.muted,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: _Voucher.line, width: 1.5),
                            ),
                            child: _qrWidget(numero, size: 148),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            numero,
                            style: const TextStyle(
                              color: _Voucher.ink,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.4,
                              fontFamily: 'monospace',
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(child: _StubChip(label: 'DE', value: villeDep)),
                              const SizedBox(width: 8),
                              Expanded(child: _StubChip(label: 'À', value: villeArr)),
                              const SizedBox(width: 8),
                              Expanded(child: _StubChip(label: 'DATE', value: dateStr)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),

        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceMuted,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.borderGrey),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info_outline_rounded, size: 18, color: AppColors.primaryBlue),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Présentez ce QR code au contrôleur. Si le statut est « En attente », réglez le paiement au guichet avant le départ.',
                  style: TextStyle(color: AppColors.textGrey, height: 1.45, fontSize: 13),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/home', (_) => false),
          icon: const Icon(Icons.home_outlined, size: 18),
          label: const Text('Retour à l\'accueil'),
        ),
      ],
    );
  }
}

class _CompanyLogo extends StatelessWidget {
  final String? url;
  final String name;

  const _CompanyLogo({required this.url, required this.name});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _Voucher.gold, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: _Voucher.gold.withValues(alpha: 0.25),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: url != null
          ? Image.network(
              url!,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _fallback(),
            )
          : _fallback(),
    );
  }

  Widget _fallback() {
    final initial = name.trim().isNotEmpty ? name.trim()[0].toUpperCase() : 'B';
    return ColoredBox(
      color: _Voucher.gold.withValues(alpha: 0.12),
      child: Center(
        child: Text(
          initial,
          style: GoogleFonts.libreBaskerville(
            color: _Voucher.goldDeep,
            fontSize: 22,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class _CityCol extends StatelessWidget {
  final String label;
  final String city;
  final String? time;
  final bool alignEnd;

  const _CityCol({
    required this.label,
    required this.city,
    this.time,
    this.alignEnd = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: _Voucher.goldDeep,
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          city,
          textAlign: alignEnd ? TextAlign.right : TextAlign.left,
          style: GoogleFonts.libreBaskerville(
            color: _Voucher.ink,
            fontSize: 17,
            fontWeight: FontWeight.w700,
            height: 1.15,
          ),
        ),
        if (time != null) ...[
          const SizedBox(height: 4),
          Text(
            time!,
            style: const TextStyle(
              color: _Voucher.ink,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: _Voucher.goldDeep,
            fontSize: 9,
            fontWeight: FontWeight.w800,
            letterSpacing: 1.1,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: _Voucher.ink,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _StubChip extends StatelessWidget {
  final String label;
  final String value;

  const _StubChip({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: _Voucher.gold.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: _Voucher.line),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(
              color: _Voucher.goldDeep,
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: _Voucher.ink,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _GoldRule extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 1.2,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0x00C9A227),
            _Voucher.gold,
            Color(0x00C9A227),
          ],
        ),
      ),
    );
  }
}

/// Ligne perforée façon ticket (encoches + tirets).
class _TicketPerforation extends StatelessWidget {
  final Color color;
  const _TicketPerforation({required this.color});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 24,
      child: Stack(
        alignment: Alignment.center,
        children: [
          const ColoredBox(color: _Voucher.paper, child: SizedBox.expand()),
          Row(
            children: [
              Transform.translate(
                offset: const Offset(-12, 0),
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                ),
              ),
              Expanded(
                child: CustomPaint(
                  painter: _DashPainter(color: _Voucher.goldDeep.withValues(alpha: 0.55)),
                  size: const Size(double.infinity, 2),
                ),
              ),
              Transform.translate(
                offset: const Offset(12, 0),
                child: Container(
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                ),
              ),
            ],
          ),
          // Pastilles or style poinçons
          Positioned(
            left: 28,
            child: Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: _Voucher.gold,
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            right: 28,
            child: Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: _Voucher.gold,
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DashPainter extends CustomPainter {
  final Color color;
  _DashPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;
    const dash = 6.0;
    const gap = 5.0;
    var x = 0.0;
    final y = size.height / 2;
    while (x < size.width) {
      canvas.drawLine(Offset(x, y), Offset(math.min(x + dash, size.width), y), paint);
      x += dash + gap;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
