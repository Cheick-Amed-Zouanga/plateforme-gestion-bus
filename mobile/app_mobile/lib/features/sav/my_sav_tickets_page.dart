import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/network/api_client.dart';
import '../../core/services/sav_service.dart';
import '../../core/theme/app_theme.dart';
import 'create_sav_ticket_page.dart';
import 'sav_ticket_chat_page.dart';

class MySavTicketsPage extends StatefulWidget {
  final bool isGuest;
  final VoidCallback onNeedAuth;

  const MySavTicketsPage({
    super.key,
    required this.isGuest,
    required this.onNeedAuth,
  });

  @override
  State<MySavTicketsPage> createState() => _MySavTicketsPageState();
}

class _MySavTicketsPageState extends State<MySavTicketsPage> {
  List<Map<String, dynamic>> _tickets = [];
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (!widget.isGuest) _load();
  }

  @override
  void didUpdateWidget(covariant MySavTicketsPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!widget.isGuest && oldWidget.isGuest) _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await SavService.instance.mesTickets();
      if (!mounted) return;
      setState(() => _tickets = list);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'Impossible de charger vos tickets.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openCreate() async {
    final created = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const CreateSavTicketPage()),
    );
    if (created == true) _load();
  }

  void _openChat(Map<String, dynamic> ticket) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => SavTicketChatPage(ticketId: ticket['id'] as int),
      ),
    ).then((_) => _load());
  }

  Color _statutColor(String? s) {
    switch (s) {
      case 'OUVERT':
        return AppColors.orange;
      case 'EN_COURS':
        return AppColors.primaryBlue;
      case 'RESOLU':
        return AppColors.teal;
      default:
        return AppColors.textGrey;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isGuest) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.support_agent_rounded, size: 56, color: AppColors.primaryBlue),
              const SizedBox(height: 16),
              const Text(
                'Connectez-vous pour contacter le support',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Créez un ticket et échangez en direct avec le SAV de la compagnie.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textGrey),
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: widget.onNeedAuth,
                child: const Text('Se connecter'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreate,
        icon: const Icon(Icons.add_comment_rounded),
        label: const Text('Nouveau ticket'),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading && _tickets.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : _error != null && _tickets.isEmpty
                ? ListView(
                    children: [
                      const SizedBox(height: 80),
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          children: [
                            Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.errorRed)),
                            const SizedBox(height: 12),
                            OutlinedButton(onPressed: _load, child: const Text('Réessayer')),
                          ],
                        ),
                      ),
                    ],
                  )
                : _tickets.isEmpty
                    ? ListView(
                        children: const [
                          SizedBox(height: 80),
                          Padding(
                            padding: EdgeInsets.all(24),
                            child: Column(
                              children: [
                                Icon(Icons.chat_bubble_outline, size: 48, color: AppColors.textGrey),
                                SizedBox(height: 12),
                                Text(
                                  'Aucun ticket pour le moment.\nAppuyez sur « Nouveau ticket » pour écrire au SAV.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: AppColors.textGrey, height: 1.4),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
                        itemCount: _tickets.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, i) {
                          final t = _tickets[i];
                          final statut = (t['statut'] ?? '').toString();
                          final date = t['cree_le'] != null
                              ? DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(t['cree_le'].toString()).toLocal())
                              : '';
                          final msgs = (t['messages'] as List?) ?? [];
                          return Card(
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              title: Text(
                                t['sujet']?.toString() ?? 'Ticket',
                                style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.navy),
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${t['statut_display'] ?? statut} · $date',
                                      style: TextStyle(color: _statutColor(statut), fontSize: 12, fontWeight: FontWeight.w600),
                                    ),
                                    if (msgs.isNotEmpty)
                                      Text(
                                        '${msgs.length} message(s)',
                                        style: const TextStyle(fontSize: 12, color: AppColors.textGrey),
                                      ),
                                  ],
                                ),
                              ),
                              trailing: const Icon(Icons.chat_rounded, color: AppColors.primaryBlue),
                              onTap: () => _openChat(t),
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}
